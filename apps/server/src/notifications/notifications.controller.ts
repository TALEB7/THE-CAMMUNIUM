import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get(':userId')
  async getUserNotifications(
    @Param('userId') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.notificationsService.getUserNotifications(
      userId,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  @Get(':userId/unread-count')
  async getUnreadCount(@Param('userId') userId: string) {
    const count = await this.notificationsService.getUnreadCount(userId);
    return { unreadCount: count };
  }

  @Patch(':id/read')
  async markAsRead(
    @Param('id') id: string,
    @Body('userId') userId: string,
  ) {
    return this.notificationsService.markAsRead(id, userId);
  }

  @Patch(':userId/read-all')
  async markAllAsRead(@Param('userId') userId: string) {
    return this.notificationsService.markAllAsRead(userId);
  }

  @Delete(':id')
  async deleteNotification(
    @Param('id') id: string,
    @Body('userId') userId: string,
  ) {
    return this.notificationsService.deleteNotification(id, userId);
  }

  @Get(':userId/preferences')
  async getPreferences(@Param('userId') userId: string) {
    return this.notificationsService.getPreferences(userId);
  }

  @Patch(':userId/preferences')
  async updatePreferences(
    @Param('userId') userId: string,
    @Body() prefs: Record<string, boolean>,
  ) {
    return this.notificationsService.updatePreferences(userId, prefs);
  }
}
