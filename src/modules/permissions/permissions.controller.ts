import { Body, Controller, Delete, Param, Post } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { CreatePermissionDto } from './dto/create-permission.dto';

@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Post()
  grant(@Body() dto: CreatePermissionDto) {
    throw new Error('Not implemented');
  }

  @Delete(':id')
  revoke(@Param('id') id: string) {
    throw new Error('Not implemented');
  }
}
