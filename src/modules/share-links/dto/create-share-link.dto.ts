import { IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateShareLinkDto {
  @IsUUID()
  fileId: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  ttlSeconds?: number;

  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxDownloads?: number;
}
