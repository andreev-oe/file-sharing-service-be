import { Injectable } from '@nestjs/common';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { Note } from './entities/note.entity';

@Injectable()
export class NotesService {
  async create(authorId: string, dto: CreateNoteDto): Promise<Note> {
    throw new Error('Not implemented');
  }

  async findByFile(fileId: string, page: number, limit: number): Promise<{ data: Note[]; total: number }> {
    throw new Error('Not implemented');
  }

  async update(id: string, authorId: string, dto: UpdateNoteDto): Promise<Note> {
    throw new Error('Not implemented');
  }

  async remove(id: string, authorId: string): Promise<void> {
    throw new Error('Not implemented');
  }
}
