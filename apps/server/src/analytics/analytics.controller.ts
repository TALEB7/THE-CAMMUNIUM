import { Controller, Get, Post, Body, Query, Headers, Param } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard/:clerkId')
  async getUserDashboard(@Param('clerkId') clerkId: string) {
    return this.analyticsService.getUserDashboard(clerkId);
  }

  @Post('track')
  async trackActivity(@Body() body: {
    userId: string; action: string; metadata?: any;
    ipAddress?: string; userAgent?: string;
  }) {
    return this.analyticsService.trackActivity(body);
  }

  @Get('daily')
  async getDailyStats(@Query('days') days?: string) {
    return this.analyticsService.getDailyStats(days ? parseInt(days) : 30);
  }

  @Post('snapshot')
  async generateSnapshot(@Headers('x-admin-id') adminId: string) {
    return this.analyticsService.generateDailySnapshot();
  }

  @Get('top-actions')
  async getTopActions(@Query('days') days?: string) {
    return this.analyticsService.getTopActions(days ? parseInt(days) : 7);
  }

  @Get('revenue')
  async getRevenueChart(@Query('days') days?: string) {
    return this.analyticsService.getRevenueChart(days ? parseInt(days) : 30);
  }

  @Get('growth')
  async getGrowthMetrics() {
    return this.analyticsService.getGrowthMetrics();
  }
}
