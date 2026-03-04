import {
  Controller, Get, Patch, Body, Param, Query, Headers,
} from '@nestjs/common';
import { AdminService } from './admin.service';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  async getDashboardStats(@Headers('x-admin-id') adminId: string) {
    return this.adminService.getDashboardStats(adminId);
  }

  @Get('users')
  async getUsers(
    @Headers('x-admin-id') adminId: string,
    @Query('search') search?: string,
    @Query('role') role?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getUsers(adminId, {
      search, role, status,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    });
  }

  @Patch('users/:id/status')
  async updateUserStatus(
    @Headers('x-admin-id') adminId: string,
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    return this.adminService.updateUserStatus(adminId, id, status);
  }

  @Patch('users/:id/role')
  async updateUserRole(
    @Headers('x-admin-id') adminId: string,
    @Param('id') id: string,
    @Body('role') role: string,
  ) {
    return this.adminService.updateUserRole(adminId, id, role);
  }

  @Get('reports')
  async getReports(
    @Headers('x-admin-id') adminId: string,
    @Query('status') status?: string,
    @Query('targetType') targetType?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getReports(adminId, {
      status, targetType,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    });
  }

  @Patch('reports/:id/resolve')
  async resolveReport(
    @Headers('x-admin-id') adminId: string,
    @Param('id') id: string,
    @Body() body: { status: string; resolution: string },
  ) {
    return this.adminService.resolveReport(adminId, id, body);
  }

  @Get('logs')
  async getAdminLogs(
    @Headers('x-admin-id') adminId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getAdminLogs(
      adminId,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 50,
    );
  }
}
