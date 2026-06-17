import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { FilesService } from './files.service';
import { UpdateFileDto } from './dto/update-file.dto';

const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024;

@UseGuards(JwtAuthGuard)
@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_FILE_SIZE_BYTES },
    }),
  )
  upload(
    @CurrentUser() user: User,
    @UploadedFile() uploadedFile: Express.Multer.File,
    @Query('folderId') folderId?: string,
  ) {
    return this.filesService.upload(user.id, uploadedFile, folderId);
  }

  @Get()
  findByFolder(@CurrentUser() user: User, @Query('folderId') folderId?: string) {
    return this.filesService.findByFolder(folderId ?? null, user.id);
  }

  @Get('search')
  search(@CurrentUser() user: User, @Query('q') query: string) {
    return this.filesService.search(user.id, query);
  }

  @Get(':id')
  findOne(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.filesService.findById(id, user.id);
  }

  @Get(':id/download')
  getDownloadUrl(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.filesService.getDownloadUrl(id, user.id);
  }

  @Get(':id/versions')
  getVersions(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.filesService.getVersions(id, user.id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateFileDto,
  ) {
    return this.filesService.update(id, user.id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  softDelete(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.filesService.softDelete(id, user.id);
  }
}
