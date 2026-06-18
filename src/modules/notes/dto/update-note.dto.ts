import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class UpdateNoteDto {
  @ApiProperty({ example: 'Обновлённый текст заметки' })
  @IsString()
  content: string;
}
