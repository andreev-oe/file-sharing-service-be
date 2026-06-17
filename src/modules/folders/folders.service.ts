import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Folder } from './entities/folder.entity';
import { CreateFolderDto } from './dto/create-folder.dto';
import { UpdateFolderDto } from './dto/update-folder.dto';
import { FolderTreeNodeDto } from './dto/folder-tree-node.dto';

const MAX_FOLDER_DEPTH = 10;

@Injectable()
export class FoldersService {
  constructor(
    @InjectRepository(Folder)
    private readonly folderRepository: Repository<Folder>,
  ) {}

  async create(ownerId: string, dto: CreateFolderDto): Promise<Folder> {
    const folderId = crypto.randomUUID();
    let path: string;

    if (dto.parentId) {
      const parentFolder = await this.findOwnedOrFail(dto.parentId, ownerId);
      const currentDepth = parentFolder.path.split('/').filter(Boolean).length;
      if (currentDepth >= MAX_FOLDER_DEPTH) {
        throw new BadRequestException(`Maximum folder depth of ${MAX_FOLDER_DEPTH} reached`);
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

    return this.folderRepository.save(folder);
  }

  async getTree(ownerId: string): Promise<FolderTreeNodeDto[]> {
    const allFolders = await this.folderRepository.find({
      where: { ownerId, isDeleted: false },
      order: { name: 'ASC' },
    });

    return this.buildTree(allFolders, null);
  }

  async getChildFolders(folderId: string, ownerId: string): Promise<Folder[]> {
    await this.findOwnedOrFail(folderId, ownerId);

    return this.folderRepository.find({
      where: { parentId: folderId, ownerId, isDeleted: false },
      order: { name: 'ASC' },
    });
  }

  async update(id: string, ownerId: string, dto: UpdateFolderDto): Promise<Folder> {
    const folder = await this.findOwnedOrFail(id, ownerId);

    const isParentChanged = dto.parentId !== undefined && dto.parentId !== folder.parentId;
    if (isParentChanged) {
      await this.moveToNewParent(folder, dto.parentId ?? null, ownerId);
    }

    if (dto.name) {
      await this.folderRepository.update(id, { name: dto.name });
    }

    return this.findOwnedOrFail(id, ownerId);
  }

  async softDelete(id: string, ownerId: string): Promise<void> {
    const folder = await this.findOwnedOrFail(id, ownerId);

    await this.folderRepository
      .createQueryBuilder()
      .update(Folder)
      .set({ isDeleted: true })
      .where('ownerId = :ownerId', { ownerId })
      .andWhere('(id = :id OR path LIKE :pathPrefix)', {
        id,
        pathPrefix: `${folder.path}/%`,
      })
      .execute();
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

      if (newParentFolder.path.startsWith(`${folder.path}/`) || newParentFolder.id === folder.id) {
        throw new BadRequestException('Cannot move a folder into its own subtree');
      }

      const newParentDepth = newParentFolder.path.split('/').filter(Boolean).length;
      if (newParentDepth >= MAX_FOLDER_DEPTH) {
        throw new BadRequestException(`Maximum folder depth of ${MAX_FOLDER_DEPTH} reached`);
      }

      newPath = `${newParentFolder.path}/${folder.id}`;
    } else {
      newPath = `/${folder.id}`;
    }

    const oldPath = folder.path;

    await this.folderRepository.update(folder.id, { parentId: newParentId, path: newPath });

    const descendants = await this.folderRepository
      .createQueryBuilder('folder')
      .where('folder.path LIKE :prefix', { prefix: `${oldPath}/%` })
      .andWhere('folder.ownerId = :ownerId', { ownerId })
      .getMany();

    for (const descendant of descendants) {
      const updatedPath = newPath + descendant.path.substring(oldPath.length);
      await this.folderRepository.update(descendant.id, { path: updatedPath });
    }
  }

  private buildTree(allFolders: Folder[], parentId: string | null): FolderTreeNodeDto[] {
    return allFolders
      .filter((folder) => { return folder.parentId === parentId; })
      .map((folder) => {
        return FolderTreeNodeDto.fromEntity(folder, this.buildTree(allFolders, folder.id));
      });
  }
}
