import { Injectable } from '@nestjs/common';
import { CreateFolderDto } from './dto/create-folder.dto';
import { UpdateFolderDto } from './dto/update-folder.dto';
import { Folder } from './entities/folder.entity';

@Injectable()
export class FoldersService {
  async create(ownerId: string, dto: CreateFolderDto): Promise<Folder> {
    throw new Error('Not implemented');
  }

  async getTree(ownerId: string): Promise<Folder[]> {
    throw new Error('Not implemented');
  }

  async getContents(folderId: string, userId: string): Promise<{ folders: Folder[]; files: any[] }> {
    throw new Error('Not implemented');
  }

  async update(id: string, dto: UpdateFolderDto): Promise<Folder> {
    throw new Error('Not implemented');
  }

  async softDelete(id: string): Promise<void> {
    throw new Error('Not implemented');
  }

  async search(userId: string, query: string): Promise<Folder[]> {
    throw new Error('Not implemented');
  }
}
