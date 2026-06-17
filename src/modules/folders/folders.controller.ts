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
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { FoldersService } from './folders.service';
import { CreateFolderDto } from './dto/create-folder.dto';
import { UpdateFolderDto } from './dto/update-folder.dto';

@UseGuards(JwtAuthGuard)
@Controller('folders')
export class FoldersController {
  constructor(private readonly foldersService: FoldersService) {}

  @Post()
  create(@CurrentUser() user: User, @Body() dto: CreateFolderDto) {
    return this.foldersService.create(user.id, dto);
  }

  @Get('tree')
  getTree(@CurrentUser() user: User) {
    return this.foldersService.getTree(user.id);
  }

  @Get('search')
  search(@CurrentUser() user: User, @Query('q') query: string) {
    return this.foldersService.search(user.id, query);
  }

  @Get(':id/contents')
  getContents(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.foldersService.getContents(id, user.id);
  }

  @Get(':id/size')
  getSize(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.foldersService.getFolderSize(id, user.id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateFolderDto,
  ) {
    return this.foldersService.update(id, user.id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  softDelete(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.foldersService.softDelete(id, user.id);
  }
}
