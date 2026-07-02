import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import type Redis from 'ioredis';
import { InjectRepository } from '@nestjs/typeorm';
import { Subscription } from 'rxjs';
import { In, Repository } from 'typeorm';
import { REDIS } from '../../infrastructure/cache/redis.provider';
import { EventBus } from '../../infrastructure/events/event-bus';
import type { PermissionChangedOnFolderEvent } from '../../infrastructure/events/permission-changed-on-folder.event';
import type { FileStorageChangedEvent } from '../../infrastructure/events/file-storage-changed.event';
import { PermissionsService } from '../permissions/permissions.service';
import { ResourceType, UserRole } from '../../common/enums';
import { Folder } from './entities/folder.entity';
import { CreateFolderDto } from './dto/create-folder.dto';
import { UpdateFolderDto } from './dto/update-folder.dto';
import { FolderTreeNodeDto } from './dto/folder-tree-node.dto';

const MAX_FOLDER_DEPTH = 10;
const FOLDER_TREE_CACHE_TTL_SECONDS = 600;
const FOLDER_TREE_CACHE_KEY_PREFIX = 'folder:tree:';
const ADMIN_TREE_CACHE_KEY = 'folder:tree:admin';
const TOTAL_SIZE_COLUMN = 'total_size';
const SIZE_TO_SUBTRACT_PARAM = 'sizeToSubtract';
const SIZE_DELTA_PARAM = 'sizeDelta';

@Injectable()
export class FoldersService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(FoldersService.name);
  private permissionChangedSubscription: Subscription;
  private fileStorageChangedSubscription: Subscription;

  constructor(
    @InjectRepository(Folder)
    private readonly folderRepository: Repository<Folder>,
    @Inject(REDIS) private readonly redis: Redis,
    private readonly eventBus: EventBus,
    private readonly permissionsService: PermissionsService,
  ) {}

  onModuleInit() {
    this.permissionChangedSubscription =
      this.eventBus.permissionChangedOnFolder.subscribe(async (event) => {
        try {
          await this.handlePermissionChangedOnFolder(event);
        } catch (error) {
          this.logger.error('handlePermissionChangedOnFolder failed', error);
        }
      });
    this.fileStorageChangedSubscription =
      this.eventBus.fileStorageChanged.subscribe(async (event) => {
        try {
          await this.applyFileSizeChange(event);
        } catch (error) {
          this.logger.error('applyFileSizeChange failed', error);
        }
      });
  }

  onModuleDestroy() {
    this.permissionChangedSubscription.unsubscribe();
    this.fileStorageChangedSubscription.unsubscribe();
  }

  async create(ownerId: string, dto: CreateFolderDto): Promise<Folder> {
    const folderId = crypto.randomUUID();
    let path: string;

    if (dto.parentId) {
      const parentFolder = await this.findOwnedOrFail(dto.parentId, ownerId);
      const currentDepth = parentFolder.path.split('/').filter(Boolean).length;
      if (currentDepth >= MAX_FOLDER_DEPTH) {
        throw new BadRequestException(
          `Maximum folder depth of ${MAX_FOLDER_DEPTH} reached`,
        );
      }
      path = `${parentFolder.path}/${folderId}`;
    } else {
      path = `/${folderId}`;
    }

    const folder = this.folderRepository.create({
      id: folderId,
      name: dto.name,
      parentId: dto.parentId ?? null,
      ownerId,
      path,
    });

    const saved = await this.folderRepository.save(folder);
    await this.invalidateTreeCache(ownerId);
    this.eventBus.folderCreated.next({
      folderId: saved.id,
      ownerId,
      parentId: dto.parentId ?? null,
    });
    return saved;
  }

  async getTree(ownerId: string, role: UserRole): Promise<FolderTreeNodeDto[]> {
    const isAdmin = role === UserRole.ADMIN;
    const cacheKey = isAdmin
      ? ADMIN_TREE_CACHE_KEY
      : `${FOLDER_TREE_CACHE_KEY_PREFIX}${ownerId}`;

    const cached = await this.redis.get(cacheKey);
    if (cached !== null) {
      const tree: FolderTreeNodeDto[] = JSON.parse(cached);
      return tree;
    }

    let allFolders: Folder[];

    if (isAdmin) {
      allFolders = await this.folderRepository.find({
        where: { isDeleted: false },
        order: { name: 'ASC' },
      });
    } else {
      const ownedFolders = await this.folderRepository.find({
        where: { ownerId, isDeleted: false },
        order: { name: 'ASC' },
      });

      const permittedFolderIds =
        await this.permissionsService.getAccessibleResourceIds(
          ownerId,
          ResourceType.FOLDER,
        );

      if (permittedFolderIds.length > 0) {
        const permittedFolders = await this.folderRepository.find({
          where: { id: In(permittedFolderIds), isDeleted: false },
        });

        const folderMap = new Map<string, Folder>(
          ownedFolders.map((folder) => {
            return [folder.id, folder];
          }),
        );
        for (const folder of permittedFolders) {
          folderMap.set(folder.id, folder);
        }

        const ancestorIds = new Set<string>();
        for (const folder of permittedFolders) {
          const pathSegments = folder.path.split('/').filter(Boolean);
          const ancestorSegments = pathSegments.slice(0, -1);
          for (const ancestorId of ancestorSegments) {
            if (!folderMap.has(ancestorId)) {
              ancestorIds.add(ancestorId);
            }
          }
        }

        if (ancestorIds.size > 0) {
          const ancestorFolders = await this.folderRepository.find({
            where: { id: In([...ancestorIds]), isDeleted: false },
          });
          for (const folder of ancestorFolders) {
            folderMap.set(folder.id, folder);
          }
        }

        allFolders = [...folderMap.values()].sort((folderA, folderB) => {
          return folderA.name.localeCompare(folderB.name);
        });
      } else {
        allFolders = ownedFolders;
      }
    }

    const tree = this.buildTree(allFolders, null);
    await this.redis.set(
      cacheKey,
      JSON.stringify(tree),
      'EX',
      FOLDER_TREE_CACHE_TTL_SECONDS,
    );
    return tree;
  }

  async findByIds(
    ids: string[],
    userId: string,
    isAdmin: boolean,
  ): Promise<Folder[]> {
    if (ids.length === 0) {
      return [];
    }
    if (isAdmin) {
      return this.folderRepository.find({
        where: { id: In(ids), isDeleted: false },
        select: { id: true, name: true },
      });
    }
    const permittedFolderIds =
      await this.permissionsService.getAccessibleResourceIds(
        userId,
        ResourceType.FOLDER,
      );
    const accessibleIds = permittedFolderIds.filter((folderId) => {
      return ids.includes(folderId);
    });
    if (accessibleIds.length > 0) {
      return this.folderRepository.find({
        where: [
          { id: In(ids), ownerId: userId, isDeleted: false },
          { id: In(accessibleIds), isDeleted: false },
        ],
        select: { id: true, name: true },
      });
    }
    return this.folderRepository.find({
      where: { id: In(ids), ownerId: userId, isDeleted: false },
      select: { id: true, name: true },
    });
  }

  async getChildFolders(folderId: string, userId: string): Promise<Folder[]> {
    const permittedFolderIds =
      await this.permissionsService.getAccessibleResourceIds(
        userId,
        ResourceType.FOLDER,
      );

    if (permittedFolderIds.length > 0) {
      return this.folderRepository.find({
        where: [
          { parentId: folderId, ownerId: userId, isDeleted: false },
          {
            parentId: folderId,
            id: In(permittedFolderIds),
            isDeleted: false,
          },
        ],
        order: { name: 'ASC' },
      });
    }

    return this.folderRepository.find({
      where: { parentId: folderId, ownerId: userId, isDeleted: false },
      order: { name: 'ASC' },
    });
  }

  async update(
    id: string,
    ownerId: string,
    dto: UpdateFolderDto,
  ): Promise<Folder> {
    const folder = await this.findOwnedOrFail(id, ownerId);

    const isParentChanged =
      dto.parentId !== undefined && dto.parentId !== folder.parentId;
    if (isParentChanged) {
      await this.moveToNewParent(folder, dto.parentId ?? null, ownerId);
    }

    if (dto.name) {
      await this.folderRepository.update(id, { name: dto.name });
    }

    await this.invalidateTreeCache(ownerId);
    return this.findOwnedOrFail(id, ownerId);
  }

  async softDelete(id: string, ownerId: string): Promise<void> {
    const folder = await this.findOwnedOrFail(id, ownerId);
    const sizeToSubtract = folder.totalSize;

    await this.folderRepository
      .createQueryBuilder()
      .update(Folder)
      .set({ isDeleted: true, totalSize: 0 })
      .where('ownerId = :ownerId', { ownerId })
      .andWhere('(id = :id OR path LIKE :pathPrefix)', {
        id,
        pathPrefix: `${folder.path}/%`,
      })
      .execute();

    if (sizeToSubtract > 0) {
      await this.folderRepository
        .createQueryBuilder()
        .update(Folder)
        .set({
          totalSize: () => {
            return `"${TOTAL_SIZE_COLUMN}" - :${SIZE_TO_SUBTRACT_PARAM}`;
          },
        })
        .setParameter(SIZE_TO_SUBTRACT_PARAM, sizeToSubtract)
        .where('CAST(:folderPath AS text) LIKE CONCAT(path, :suffix)', {
          folderPath: folder.path,
          suffix: '/%',
        })
        .andWhere('isDeleted = :isDeleted', { isDeleted: false })
        .execute();
    }

    await this.invalidateTreeCache(ownerId);
  }

  async search(ownerId: string, query: string): Promise<Folder[]> {
    return this.folderRepository
      .createQueryBuilder('folder')
      .where('folder.ownerId = :ownerId', { ownerId })
      .andWhere('folder.isDeleted = false')
      .andWhere('folder.name ILIKE :query', { query: `%${query}%` })
      .orderBy('folder.name', 'ASC')
      .getMany();
  }

  private async applyFileSizeChange(
    event: FileStorageChangedEvent,
  ): Promise<void> {
    const folder = await this.folderRepository.findOne({
      where: { id: event.folderId },
      select: { path: true },
    });
    if (!folder) {
      return;
    }

    await this.folderRepository
      .createQueryBuilder()
      .update(Folder)
      .set({
        totalSize: () => {
          return `"${TOTAL_SIZE_COLUMN}" + :${SIZE_DELTA_PARAM}`;
        },
      })
      .setParameter(SIZE_DELTA_PARAM, event.sizeDelta)
      .where('id = :folderId', { folderId: event.folderId })
      .orWhere('CAST(:folderPath AS text) LIKE CONCAT(path, :suffix)', {
        folderPath: folder.path,
        suffix: '/%',
      })
      .execute();
  }

  private async handlePermissionChangedOnFolder(
    event: PermissionChangedOnFolderEvent,
  ): Promise<void> {
    await this.invalidateAllTreeCaches();

    const parentFolder = await this.folderRepository.findOne({
      where: { id: event.folderId },
      select: { path: true },
    });
    if (!parentFolder) {
      return;
    }

    const descendants = await this.folderRepository
      .createQueryBuilder('folder')
      .where('folder.path LIKE :prefix', { prefix: `${parentFolder.path}/%` })
      .andWhere('folder.isDeleted = false')
      .select(['folder.id'])
      .getMany();

    if (descendants.length === 0) {
      return;
    }

    this.eventBus.cascadePermissionsToFolders.next({
      action: event.action,
      folderIds: descendants.map((folder) => {
        return folder.id;
      }),
      subjectType: event.subjectType,
      subjectId: event.subjectId,
      permissionLevel: event.permissionLevel,
    });
  }

  private async findOwnedOrFail(id: string, ownerId: string): Promise<Folder> {
    const folder = await this.folderRepository.findOne({
      where: { id, ownerId, isDeleted: false },
    });
    if (!folder) {
      throw new NotFoundException('Folder not found');
    }
    return folder;
  }

  private async moveToNewParent(
    folder: Folder,
    newParentId: string | null,
    ownerId: string,
  ): Promise<void> {
    let newPath: string;

    if (newParentId) {
      const newParentFolder = await this.findOwnedOrFail(newParentId, ownerId);

      if (
        newParentFolder.path.startsWith(`${folder.path}/`) ||
        newParentFolder.id === folder.id
      ) {
        throw new BadRequestException(
          'Cannot move a folder into its own subtree',
        );
      }

      const newParentDepth = newParentFolder.path
        .split('/')
        .filter(Boolean).length;
      if (newParentDepth >= MAX_FOLDER_DEPTH) {
        throw new BadRequestException(
          `Maximum folder depth of ${MAX_FOLDER_DEPTH} reached`,
        );
      }

      newPath = `${newParentFolder.path}/${folder.id}`;
    } else {
      newPath = `/${folder.id}`;
    }

    const oldPath = folder.path;

    await this.folderRepository.update(folder.id, {
      parentId: newParentId,
      path: newPath,
    });

    const descendants = await this.folderRepository
      .createQueryBuilder('folder')
      .where('folder.path LIKE :prefix', { prefix: `${oldPath}/%` })
      .andWhere('folder.ownerId = :ownerId', { ownerId })
      .getMany();

    for (const descendant of descendants) {
      const updatedPath = `${newPath}${descendant.path.substring(oldPath.length)}`;
      await this.folderRepository.update(descendant.id, { path: updatedPath });
    }
  }

  private async invalidateTreeCache(ownerId: string): Promise<void> {
    await this.redis.del(
      `${FOLDER_TREE_CACHE_KEY_PREFIX}${ownerId}`,
      ADMIN_TREE_CACHE_KEY,
    );
  }

  private async invalidateAllTreeCaches(): Promise<void> {
    const keys = await this.redis.keys(`${FOLDER_TREE_CACHE_KEY_PREFIX}*`);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }

  private buildTree(
    allFolders: Folder[],
    parentId: string | null,
  ): FolderTreeNodeDto[] {
    return allFolders
      .filter((folder) => {
        return folder.parentId === parentId;
      })
      .map((folder) => {
        return FolderTreeNodeDto.fromEntity(
          folder,
          this.buildTree(allFolders, folder.id),
        );
      });
  }
}
