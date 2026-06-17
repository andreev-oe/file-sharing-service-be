import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { FoldersService } from './folders.service';
import { CreateFolderDto } from './dto/create-folder.dto';
import { UpdateFolderDto } from './dto/update-folder.dto';

@Controller('folders')
export class FoldersController {
  constructor(private readonly foldersService: FoldersService) {}

  @Post()
  create(@Body() dto: CreateFolderDto) {
    throw new Error('Not implemented');
  }

  @Get('tree')
  getTree() {
    throw new Error('Not implemented');
  }

  @Get(':id/contents')
  getContents(@Param('id') id: string) {
    throw new Error('Not implemented');
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateFolderDto) {
    throw new Error('Not implemented');
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    throw new Error('Not implemented');
  }
}
