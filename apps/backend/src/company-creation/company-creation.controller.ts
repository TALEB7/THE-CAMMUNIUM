import { Controller, Get, Post, Patch, Param, Query, Body, Headers } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CompanyCreationService } from './company-creation.service';

@ApiTags('company-creation')
@Controller('company-creation')
export class CompanyCreationController {
  constructor(private readonly service: CompanyCreationService) {}

  @Get(':userId')
  getOrCreate(@Param('userId') userId: string) {
    return this.service.getOrCreate(userId);
  }

  @Get(':userId/status')
  getStatus(@Param('userId') userId: string) {
    return this.service.getStatus(userId);
  }

  @Patch(':userId/step/1')
  updateStep1(@Param('userId') userId: string, @Body() body: any) {
    return this.service.updateStep1(userId, body);
  }

  @Patch(':userId/step/2')
  updateStep2(@Param('userId') userId: string, @Body() body: any) {
    return this.service.updateStep2(userId, body);
  }

  @Patch(':userId/step/3')
  updateStep3(@Param('userId') userId: string, @Body() body: any) {
    return this.service.updateStep3(userId, body);
  }

  @Patch(':userId/step/4')
  updateStep4(@Param('userId') userId: string, @Body() body: any) {
    return this.service.updateStep4(userId, body);
  }

  @Post(':userId/submit')
  submit(@Param('userId') userId: string) {
    return this.service.submit(userId);
  }

  // Admin endpoints
  @Get('admin/submissions')
  getAllSubmissions(
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.service.getAllSubmissions({ status, page, limit });
  }

  @Patch('admin/:companyId/review')
  review(
    @Param('companyId') companyId: string,
    @Headers('x-admin-id') adminId: string,
    @Body() body: { approved: boolean; notes?: string; rejectionReason?: string },
  ) {
    return this.service.review(companyId, adminId, body);
  }
}
