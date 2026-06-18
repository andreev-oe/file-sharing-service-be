import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { GroupsService } from './groups.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { AddMemberDto } from './dto/add-member.dto';

@ApiTags('Groups')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Post()
  @ApiOperation({ summary: 'Создать новую группу пользователей' })
  create(@CurrentUser() user: User, @Body() dto: CreateGroupDto) {
    return this.groupsService.create(user.id, dto);
  }

  @Post(':id/members')
  @ApiOperation({ summary: 'Добавить участника в группу с указанием роли' })
  addMember(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddMemberDto,
  ) {
    return this.groupsService.addMember(id, user.id, dto);
  }

  @Delete(':id/members/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Удалить участника из группы' })
  removeMember(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    return this.groupsService.removeMember(id, user.id, userId);
  }

  @Get(':id/members')
  @ApiOperation({ summary: 'Получить список участников группы' })
  getMembers(@Param('id', ParseUUIDPipe) id: string) {
    return this.groupsService.getMembers(id);
  }
}
