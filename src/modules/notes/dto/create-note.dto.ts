import { IsString, IsUUID } from 'class-validator';

export class CreateNoteDto {
  @IsUUID()
  fileId: string;

  @IsString()
  content: string;
}
