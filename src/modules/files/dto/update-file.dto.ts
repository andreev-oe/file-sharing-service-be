import { IsOptional, IsString, IsUUID } from 'class-validator';

export class UpdateFileDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsUUID()
  folderId?: string;
}
