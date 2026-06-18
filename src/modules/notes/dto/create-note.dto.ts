import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID } from 'class-validator';

export class CreateNoteDto {
  @ApiProperty({ example: 'uuid-of-file' })
  @IsUUID()
  fileId: string;

  @ApiProperty({ example: 'Текст заметки' })
  @IsString()
  content: string;
}
