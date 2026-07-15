import { Controller, Get, Post, Body, Query, Param } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard/:userId')
  async getUserDashboard(@Param('userId') userId: string) {
    return this.analyticsService.getUserDashboard(userId);
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
  async generateSnapshot() {
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

  @Get('churn-risk')
  async getChurnRisk(
    @Query('risk') risk?: string,
    @Query('userIds') userIds?: string,
  ) {
    const ids = userIds ? userIds.split(',').filter(Boolean) : undefined;
    return this.analyticsService.getChurnRisk(ids, risk);
  }


}
