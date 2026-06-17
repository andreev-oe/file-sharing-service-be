import { IsEnum, IsUUID } from 'class-validator';
import { GroupMemberRole } from '../../../common/enums';

export class AddMemberDto {
  @IsUUID()
  userId: string;

  @IsEnum(GroupMemberRole)
  role: GroupMemberRole;
}
