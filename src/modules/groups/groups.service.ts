import { Injectable } from '@nestjs/common';
import { CreateGroupDto } from './dto/create-group.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { Group } from './entities/group.entity';
import { GroupMember } from './entities/group-member.entity';

@Injectable()
export class GroupsService {
  async create(ownerId: string, dto: CreateGroupDto): Promise<Group> {
    throw new Error('Not implemented');
  }

  async addMember(groupId: string, dto: AddMemberDto): Promise<GroupMember> {
    throw new Error('Not implemented');
  }

  async removeMember(groupId: string, userId: string): Promise<void> {
    throw new Error('Not implemented');
  }

  async getMembers(groupId: string): Promise<GroupMember[]> {
    throw new Error('Not implemented');
  }
}
