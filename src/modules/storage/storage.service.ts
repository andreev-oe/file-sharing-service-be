import { Injectable } from '@nestjs/common';

@Injectable()
export class StorageService {
  async upload(key: string, buffer: Buffer, mimeType: string): Promise<string> {
    throw new Error('Not implemented');
  }

  async getPresignedUrl(key: string, ttlSeconds: number): Promise<string> {
    throw new Error('Not implemented');
  }

  async delete(key: string): Promise<void> {
    throw new Error('Not implemented');
  }
}
