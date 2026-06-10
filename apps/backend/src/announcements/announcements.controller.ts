import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AnnouncementsService } from './announcements.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('announcements')
@Controller('announcements')
export class AnnouncementsController {
  constructor(private readonly announcementsService: AnnouncementsService) {}

  // ── Admin ──

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create announcement (admin)' })
  create(@CurrentUser('id') authorId: string, @Body() body: any) {
    return this.announcementsService.create({ ...body, authorId });
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update announcement (admin)' })
  update(@Param('id') id: string, @Body() body: any) {
    return this.announcementsService.update(id, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete announcement (admin)' })
  remove(@Param('id') id: string) {
    return this.announcementsService.delete(id);
  }

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get all announcements (admin)' })
  getAll(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.announcementsService.getAll(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  // ── Public ──

  @Get()
  @ApiOperation({ summary: 'Get published announcements' })
  getPublished(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.announcementsService.getPublished(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
    );
  }

  @Get('unread/:userId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get unread count' })
  unreadCount(@CurrentUser('id') userId: string) {
    return this.announcementsService.getUnreadCount(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get announcement by ID' })
  findOne(@Param('id') id: string) {
    return this.announcementsService.getById(id);
  }

  @Post(':id/read')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Mark announcement as read' })
  markRead(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.announcementsService.markRead(id, userId);
  }
}
