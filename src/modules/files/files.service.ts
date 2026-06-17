import { Injectable } from '@nestjs/common';
import { UpdateFileDto } from './dto/update-file.dto';
import { File } from './entities/file.entity';

@Injectable()
export class FilesService {
  async upload(
    uploaderId: string,
    file: Express.Multer.File,
    folderId?: string,
  ): Promise<File> {
    throw new Error('Not implemented');
  }

  async findById(id: string): Promise<File> {
    throw new Error('Not implemented');
  }

  async getDownloadUrl(id: string): Promise<string> {
    throw new Error('Not implemented');
  }

  async update(id: string, dto: UpdateFileDto): Promise<File> {
    throw new Error('Not implemented');
  }

  async softDelete(id: string): Promise<void> {
    throw new Error('Not implemented');
  }

  async getVersions(id: string): Promise<File[]> {
    throw new Error('Not implemented');
  }

  async search(userId: string, query: string): Promise<File[]> {
    throw new Error('Not implemented');
  }
}
