import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FilesService } from './files.service';
import { UpdateFileDto } from './dto/update-file.dto';

@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  upload(@UploadedFile() file: Express.Multer.File) {
    throw new Error('Not implemented');
  }

  @Get('search')
  search(@Query('q') query: string) {
    throw new Error('Not implemented');
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    throw new Error('Not implemented');
  }

  @Get(':id/download')
  getDownloadUrl(@Param('id') id: string) {
    throw new Error('Not implemented');
  }

  @Get(':id/versions')
  getVersions(@Param('id') id: string) {
    throw new Error('Not implemented');
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateFileDto) {
    throw new Error('Not implemented');
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    throw new Error('Not implemented');
  }
}
