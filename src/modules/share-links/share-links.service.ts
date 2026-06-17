import { Injectable } from '@nestjs/common';
import { CreateShareLinkDto } from './dto/create-share-link.dto';
import { ShareLink } from './entities/share-link.entity';

@Injectable()
export class ShareLinksService {
  async create(createdById: string, dto: CreateShareLinkDto): Promise<ShareLink> {
    throw new Error('Not implemented');
  }

  async findByToken(token: string, password?: string): Promise<ShareLink> {
    throw new Error('Not implemented');
  }

  async deactivate(id: string, userId: string): Promise<void> {
    throw new Error('Not implemented');
  }
}
