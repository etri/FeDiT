import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

import { CreateNoticeDto } from './dto/create-notice.dto';
import { NoticeQueryDto } from './dto/notice-query.dto';
import { UpdateNoticeDto } from './dto/update-notice.dto';
import { NoticesService } from './notices.service';
import { Role } from '../common/constants';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('notices')
export class NoticesController {
  constructor(private readonly noticesService: NoticesService) {}

  @Public()
  @Get()
  findAll(@Query() query: NoticeQueryDto) {
    return this.noticesService.findAll(query);
  }

  @Get('admin')
  @Roles(Role.ADMIN)
  findAllAdmin(@Query() query: NoticeQueryDto) {
    return this.noticesService.findAllAdmin(query);
  }

  @Get('admin/:id')
  @Roles(Role.ADMIN)
  findOneAdmin(@Param('id', ParseUUIDPipe) id: string) {
    return this.noticesService.findOneAdmin(id);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.noticesService.findOne(id);
  }

  @Post()
  @Roles(Role.ADMIN)
  create(@Body() dto: CreateNoticeDto, @CurrentUser('id') userId: string) {
    return this.noticesService.create(dto, userId);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateNoticeDto) {
    return this.noticesService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.noticesService.remove(id);
  }

  @Patch(':id/publish')
  @Roles(Role.ADMIN)
  publish(@Param('id', ParseUUIDPipe) id: string) {
    return this.noticesService.publish(id);
  }

  @Patch(':id/pin')
  @Roles(Role.ADMIN)
  togglePin(@Param('id', ParseUUIDPipe) id: string) {
    return this.noticesService.togglePin(id);
  }
}
