import { IsOptional, IsString, IsUUID, ValidateIf } from 'class-validator';

export class UpdateFileDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @ValidateIf((object: UpdateFileDto) => { return object.folderId !== null; })
  @IsUUID()
  folderId?: string | null;
}
