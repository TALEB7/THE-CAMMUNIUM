import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  async createReport(@Body() body: {
    reporterId: string; targetType: string;
    targetId: string; reason: string; description?: string;
  }) {
    return this.reportsService.createReport(body);
  }

  @Get(':userId')
  async getUserReports(@Param('userId') userId: string) {
    return this.reportsService.getUserReports(userId);
  }
}
