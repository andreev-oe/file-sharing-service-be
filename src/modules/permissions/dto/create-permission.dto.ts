import { IsEnum, IsUUID } from 'class-validator';
import { PermissionLevel, ResourceType, SubjectType } from '../../../common/enums';

export class CreatePermissionDto {
  @IsEnum(SubjectType)
  subjectType: SubjectType;

  @IsUUID()
  subjectId: string;

  @IsEnum(ResourceType)
  resourceType: ResourceType;

  @IsUUID()
  resourceId: string;

  @IsEnum(PermissionLevel)
  permission: PermissionLevel;
}
