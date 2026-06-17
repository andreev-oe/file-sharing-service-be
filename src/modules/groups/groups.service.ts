import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GroupMemberRole } from '../../common/enums';
import { Group } from './entities/group.entity';
import { GroupMember } from './entities/group-member.entity';
import { CreateGroupDto } from './dto/create-group.dto';
import { AddMemberDto } from './dto/add-member.dto';

const MANAGER_ROLES = new Set([GroupMemberRole.OWNER, GroupMemberRole.ADMIN]);

@Injectable()
export class GroupsService {
  constructor(
    @InjectRepository(Group)
    private readonly groupRepository: Repository<Group>,
    @InjectRepository(GroupMember)
    private readonly groupMemberRepository: Repository<GroupMember>,
  ) {}

  async create(ownerId: string, dto: CreateGroupDto): Promise<Group> {
    const group = this.groupRepository.create({
      name: dto.name,
      description: dto.description ?? null,
      ownerId,
    });
    const savedGroup = await this.groupRepository.save(group);

    const ownerMember = this.groupMemberRepository.create({
      groupId: savedGroup.id,
      userId: ownerId,
      role: GroupMemberRole.OWNER,
    });
    await this.groupMemberRepository.save(ownerMember);

    return savedGroup;
  }

  async addMember(groupId: string, requesterId: string, dto: AddMemberDto): Promise<GroupMember> {
    await this.verifyManagerAccess(groupId, requesterId);

    const existing = await this.groupMemberRepository.findOne({
      where: { groupId, userId: dto.userId },
    });
    if (existing) {
      throw new ConflictException('User is already a member of this group');
    }

    const member = this.groupMemberRepository.create({
      groupId,
      userId: dto.userId,
      role: dto.role,
    });
    return this.groupMemberRepository.save(member);
  }

  async removeMember(groupId: string, requesterId: string, userId: string): Promise<void> {
    await this.verifyManagerAccess(groupId, requesterId);

    const member = await this.groupMemberRepository.findOne({
      where: { groupId, userId },
    });
    if (!member) {
      throw new NotFoundException('Member not found');
    }
    if (member.role === GroupMemberRole.OWNER) {
      throw new ForbiddenException('Cannot remove the group owner');
    }

    await this.groupMemberRepository.delete(member.id);
  }

  async getMembers(groupId: string): Promise<GroupMember[]> {
    return this.groupMemberRepository.find({
      where: { groupId },
      relations: { user: true },
      order: { createdAt: 'ASC' },
    });
  }

  private async verifyManagerAccess(groupId: string, userId: string): Promise<void> {
    const member = await this.groupMemberRepository.findOne({
      where: { groupId, userId },
    });
    if (!member || !MANAGER_ROLES.has(member.role)) {
      throw new ForbiddenException('Only group owners and admins can manage members');
    }
  }
}
