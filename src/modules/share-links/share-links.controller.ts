import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ShareLinksService } from './share-links.service';
import { CreateShareLinkDto } from './dto/create-share-link.dto';

@Controller('share-links')
export class ShareLinksController {
  constructor(private readonly shareLinksService: ShareLinksService) {}

  @Post()
  create(@Body() dto: CreateShareLinkDto) {
    throw new Error('Not implemented');
  }

  @Get(':token')
  findByToken(@Param('token') token: string) {
    throw new Error('Not implemented');
  }

  @Delete(':id')
  deactivate(@Param('id') id: string) {
    throw new Error('Not implemented');
  }
}
