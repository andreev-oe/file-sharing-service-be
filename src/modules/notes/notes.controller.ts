import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { NotesService } from './notes.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';

@Controller('notes')
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Post()
  create(@Body() dto: CreateNoteDto) {
    throw new Error('Not implemented');
  }

  @Get('file/:fileId')
  findByFile(
    @Param('fileId') fileId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    throw new Error('Not implemented');
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateNoteDto) {
    throw new Error('Not implemented');
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    throw new Error('Not implemented');
  }
}
