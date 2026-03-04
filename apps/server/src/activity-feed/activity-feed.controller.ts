import { Controller, Get, Post, Delete, Param, Query, Body } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ActivityFeedService } from './activity-feed.service';

@ApiTags('activity-feed')
@Controller('activity-feed')
export class ActivityFeedController {
  constructor(private readonly service: ActivityFeedService) {}

  @Get('global')
  getGlobalFeed(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.service.getGlobalFeed(page, limit);
  }

  @Get('personal/:userId')
  getPersonalFeed(
    @Param('userId') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.service.getPersonalFeed(userId, page, limit);
  }

  @Get('user/:userId')
  getUserFeed(
    @Param('userId') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.service.getUserFeed(userId, page, limit);
  }

  @Post()
  publishActivity(@Body() body: {
    userId: string;
    type: string;
    title: string;
    body?: string;
    entityType?: string;
    entityId?: string;
    imageUrl?: string;
    metadata?: any;
    isPublic?: boolean;
  }) {
    return this.service.publishActivity(body);
  }

  @Delete(':id')
  deleteActivity(@Param('id') id: string, @Body('userId') userId: string) {
    return this.service.deleteActivity(id, userId);
  }

  @Get('stats/:userId')
  getFeedStats(@Param('userId') userId: string) {
    return this.service.getFeedStats(userId);
  }
}
