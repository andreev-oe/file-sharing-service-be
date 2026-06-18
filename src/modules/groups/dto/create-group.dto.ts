import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateGroupDto {
  @ApiProperty({ example: 'Команда разработки' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Описание группы' })
  @IsOptional()
  @IsString()
  description?: string;
}
