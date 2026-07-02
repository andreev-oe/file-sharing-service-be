import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, In, IsNull, Repository } from 'typeorm';
import type Redis from 'ioredis';
import { REDIS } from '../../infrastructure/cache/redis.provider';
import { StorageService } from '../../infrastructure/storage/storage.service';
import { EventBus } from '../../infrastructure/events/event-bus';
import { PermissionsService } from '../permissions/permissions.service';
import { ResourceType } from '../../common/enums';
import { File } from './entities/file.entity';
import { UpdateFileDto } from './dto/update-file.dto';

const PRESIGNED_URL_TTL_SECONDS = 3600;
const PRESIGNED_URL_CACHE_TTL_SECONDS = 3000;
const PRESIGNED_URL_CACHE_KEY_PREFIX = 'file:download:';
const FILE_S3_KEY_PREFIX = 'files/';

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'application/pdf',
  'application/zip',
  'application/x-zip-compressed',
  'application/json',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.oasis.opendocument.text',
  'application/vnd.oasis.opendocument.spreadsheet',
  'application/vnd.oasis.opendocument.presentation',
  'application/vnd.apple.pages',
  'application/vnd.apple.numbers',
  'application/vnd.apple.keynote',
  'application/rtf',
  'text/plain',
  'text/csv',
  'text/rtf',
  'video/mp4',
  'video/mpeg',
  'video/quicktime',
  'audio/mpeg',
  'audio/wav',
]);

@Injectable()
export class FilesService {
  constructor(
    @InjectRepository(File)
    private readonly fileRepository: Repository<File>,
    private readonly storageService: StorageService,
    @Inject(REDIS) private readonly redis: Redis,
    private readonly eventBus: EventBus,
    private readonly permissionsService: PermissionsService,
  ) {}

  async upload(
    uploadedById: string,
    uploadedFile: Express.Multer.File,
    folderId?: string,
  ): Promise<File> {
    if (!uploadedFile) {
      throw new BadRequestException('No file provided');
    }

    this.validateMimeType(uploadedFile.mimetype);

    const originalName = Buffer.from(
      uploadedFile.originalname,
      'latin1',
    ).toString('utf8');
    const resolvedFolderId = folderId ?? null;
    const nextVersion = await this.resolveNextVersion(
      originalName,
      resolvedFolderId,
    );

    const fileId = crypto.randomUUID();
    const s3Key = `${FILE_S3_KEY_PREFIX}${uploadedById}/${fileId}/${originalName}`;

    await this.storageService.upload(
      s3Key,
      uploadedFile.buffer,
      uploadedFile.mimetype,
    );

    try {
      const file = this.fileRepository.create({
        id: fileId,
        name: originalName,
        s3Key,
        mimeType: uploadedFile.mimetype,
        size: uploadedFile.size,
        folderId: resolvedFolderId,
        uploadedById,
        version: nextVersion,
      });
      const saved = await this.fileRepository.save(file);
      this.eventBus.fileCreated.next({
        fileId: saved.id,
        ownerId: uploadedById,
      });
      if (resolvedFolderId !== null) {
        this.eventBus.fileStorageChanged.next({
          folderId: resolvedFolderId,
          sizeDelta: saved.size,
        });
      }
      return saved;
    } catch (error) {
      await this.storageService.delete(s3Key);
      throw error;
    }
  }

  async findByIds(
    ids: string[],
    userId: string,
    isAdmin: boolean,
  ): Promise<File[]> {
    if (ids.length === 0) {
      return [];
    }
    if (isAdmin) {
      return this.fileRepository.find({
        where: { id: In(ids), isDeleted: false },
        select: { id: true, name: true },
      });
    }
    const permittedFileIds =
      await this.permissionsService.getAccessibleResourceIds(
        userId,
        ResourceType.FILE,
      );
    const accessibleIds = permittedFileIds.filter((fileId) => {
      return ids.includes(fileId);
    });
    if (accessibleIds.length > 0) {
      return this.fileRepository.find({
        where: [
          { id: In(ids), uploadedById: userId, isDeleted: false },
          { id: In(accessibleIds), isDeleted: false },
        ],
        select: { id: true, name: true },
      });
    }
    return this.fileRepository.find({
      where: { id: In(ids), uploadedById: userId, isDeleted: false },
      select: { id: true, name: true },
    });
  }

  async findById(id: string): Promise<File> {
    const file = await this.fileRepository.findOne({
      where: { id, isDeleted: false },
    });
    if (!file) {
      throw new NotFoundException('File not found');
    }
    return file;
  }

  async getDownloadUrl(id: string): Promise<{ url: string }> {
    const cacheKey = `${PRESIGNED_URL_CACHE_KEY_PREFIX}${id}`;
    const cachedUrl = await this.redis.get(cacheKey);
    if (cachedUrl) {
      return { url: cachedUrl };
    }

    const file = await this.findById(id);
    const presignedUrl = await this.storageService.getPresignedUrl(
      file.s3Key,
      PRESIGNED_URL_TTL_SECONDS,
    );

    await this.redis.set(
      cacheKey,
      presignedUrl,
      'EX',
      PRESIGNED_URL_CACHE_TTL_SECONDS,
    );
    return { url: presignedUrl };
  }

  async update(id: string, dto: UpdateFileDto): Promise<File> {
    const file = await this.findById(id);

    const updatedFields: Partial<File> = {};
    if (dto.name !== undefined) {
      updatedFields.name = dto.name;
    }
    if (dto.folderId !== undefined) {
      updatedFields.folderId = dto.folderId;
      await this.invalidateDownloadUrlCache(id);
    }

    if (Object.keys(updatedFields).length === 0) {
      return file;
    }

    await this.fileRepository.update(id, updatedFields);

    if (dto.folderId !== undefined && dto.folderId !== file.folderId) {
      if (file.folderId !== null) {
        this.eventBus.fileStorageChanged.next({
          folderId: file.folderId,
          sizeDelta: -file.size,
        });
      }
      if (dto.folderId !== null) {
        this.eventBus.fileStorageChanged.next({
          folderId: dto.folderId,
          sizeDelta: file.size,
        });
      }
    }

    return this.findById(id);
  }

  async softDelete(id: string): Promise<void> {
    const file = await this.findById(id);
    await this.fileRepository.update(id, { isDeleted: true });
    await this.invalidateDownloadUrlCache(id);
    if (file.folderId !== null) {
      this.eventBus.fileStorageChanged.next({
        folderId: file.folderId,
        sizeDelta: -file.size,
      });
    }
  }

  async getVersions(id: string): Promise<File[]> {
    const currentFile = await this.findById(id);

    return this.fileRepository.find({
      where: {
        name: currentFile.name,
        folderId: currentFile.folderId ?? IsNull(),
      },
      order: { version: 'DESC' },
    });
  }

  async findByFolder(
    folderId: string | null,
    userId: string,
    isAdmin: boolean,
  ): Promise<File[]> {
    if (isAdmin) {
      const folderFilter =
        folderId === null ? {} : { folderId: folderId ?? IsNull() };
      return this.fileRepository.find({
        where: { ...folderFilter, isDeleted: false },
        order: { name: 'ASC' },
      });
    }

    const permittedFileIds =
      await this.permissionsService.getAccessibleResourceIds(
        userId,
        ResourceType.FILE,
      );
    const folderFilter = { folderId: folderId ?? IsNull() };

    if (permittedFileIds.length > 0) {
      return this.fileRepository.find({
        where: [
          { ...folderFilter, uploadedById: userId, isDeleted: false },
          { ...folderFilter, id: In(permittedFileIds), isDeleted: false },
        ],
        order: { name: 'ASC' },
      });
    }

    return this.fileRepository.find({
      where: { ...folderFilter, uploadedById: userId, isDeleted: false },
      order: { name: 'ASC' },
    });
  }

  async search(
    userId: string,
    query: string,
    isAdmin: boolean,
  ): Promise<File[]> {
    const builder = this.fileRepository
      .createQueryBuilder('file')
      .where('file.isDeleted = false')
      .andWhere('file.name ILIKE :query', { query: `%${query}%` })
      .orderBy('file.name', 'ASC');

    if (!isAdmin) {
      const permittedFileIds =
        await this.permissionsService.getAccessibleResourceIds(
          userId,
          ResourceType.FILE,
        );
      if (permittedFileIds.length > 0) {
        builder.andWhere(
          new Brackets((qb) => {
            qb.where('file.uploadedById = :userId', { userId }).orWhere(
              'file.id IN (:...permittedFileIds)',
              { permittedFileIds },
            );
          }),
        );
      } else {
        builder.andWhere('file.uploadedById = :userId', { userId });
      }
    }

    return builder.getMany();
  }

  private async resolveNextVersion(
    name: string,
    folderId: string | null,
  ): Promise<number> {
    const latestVersion = await this.fileRepository.findOne({
      where: {
        name,
        folderId: folderId ?? IsNull(),
        isDeleted: false,
      },
      order: { version: 'DESC' },
    });

    const firstVersion = 1;
    return latestVersion ? latestVersion.version + 1 : firstVersion;
  }

  private validateMimeType(mimeType: string): void {
    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      throw new UnsupportedMediaTypeException(
        `File type "${mimeType}" is not allowed`,
      );
    }
  }

  private async invalidateDownloadUrlCache(fileId: string): Promise<void> {
    await this.redis.del(`${PRESIGNED_URL_CACHE_KEY_PREFIX}${fileId}`);
  }
}
