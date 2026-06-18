import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsUUID } from 'class-validator';
import { GroupMemberRole } from '../../../common/enums';

export class AddMemberDto {
  @ApiProperty({ example: 'uuid-of-user' })
  @IsUUID()
  userId: string;

  @ApiProperty({ enum: GroupMemberRole, example: GroupMemberRole.MEMBER })
  @IsEnum(GroupMemberRole)
  role: GroupMemberRole;
}
