import { IsOptional, IsString, IsUUID, ValidateIf } from 'class-validator';

export class UpdateFolderDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @ValidateIf((object: UpdateFolderDto) => { return object.parentId !== null; })
  @IsUUID()
  parentId?: string | null;
}
