import { Injectable } from '@nestjs/common';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { Permission } from './entities/permission.entity';
import { PermissionLevel, ResourceType } from '../../common/enums';

@Injectable()
export class PermissionsService {
  async grant(dto: CreatePermissionDto): Promise<Permission> {
    throw new Error('Not implemented');
  }

  async revoke(id: string): Promise<void> {
    throw new Error('Not implemented');
  }

  async check(
    subjectId: string,
    resourceType: ResourceType,
    resourceId: string,
    required: PermissionLevel,
  ): Promise<boolean> {
    throw new Error('Not implemented');
  }
}
