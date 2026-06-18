import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '../../infrastructure/cache/cache.module';
import { EventsModule } from '../../infrastructure/events/events.module';
import { PermissionsController } from './permissions.controller';
import { PermissionsService } from './permissions.service';
import { Permission } from './entities/permission.entity';
import { GroupMember } from '../groups/entities/group-member.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Permission, GroupMember]), CacheModule, EventsModule],
  controllers: [PermissionsController],
  providers: [PermissionsService],
  exports: [PermissionsService],
})
export class PermissionsModule {}
