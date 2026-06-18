import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateFolderDto {
  @ApiProperty({ example: 'Документы' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'uuid-of-parent-folder' })
  @IsOptional()
  @IsUUID()
  parentId?: string;
}
