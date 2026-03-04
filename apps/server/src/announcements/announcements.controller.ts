import { Controller, Get, Post, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AnnouncementsService } from './announcements.service';

@ApiTags('announcements')
@Controller('announcements')
export class AnnouncementsController {
  constructor(private readonly announcementsService: AnnouncementsService) {}

  // ── Admin ──

  @Post()
  @ApiOperation({ summary: 'Create announcement (admin)' })
  create(@Body() body: any) {
    return this.announcementsService.create(body);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update announcement (admin)' })
  update(@Param('id') id: string, @Body() body: any) {
    return this.announcementsService.update(id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete announcement (admin)' })
  remove(@Param('id') id: string) {
    return this.announcementsService.delete(id);
  }

  @Get('admin/all')
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
  @ApiOperation({ summary: 'Get unread count' })
  unreadCount(@Param('userId') userId: string) {
    return this.announcementsService.getUnreadCount(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get announcement by ID' })
  findOne(@Param('id') id: string) {
    return this.announcementsService.getById(id);
  }

  @Post(':id/read')
  @ApiOperation({ summary: 'Mark announcement as read' })
  markRead(@Param('id') id: string, @Body() body: { userId: string }) {
    return this.announcementsService.markRead(id, body.userId);
  }
}
