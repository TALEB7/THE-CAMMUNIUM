import {
  Controller, Get, Patch, Body, Param, Query, Req, UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AdminService } from './admin.service';

// Every route in this controller requires a valid JWT *and* the ADMIN role.
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  getDashboardStats(@Req() req: Request) {
    return this.adminService.getDashboardStats((req as any).user.id);
  }

  @Get('users')
  getUsers(
    @Req() req: Request,
    @Query('search') search?: string,
    @Query('role') role?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getUsers((req as any).user.id, {
      search, role, status,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    });
  }

  @Patch('users/:id/status')
  updateUserStatus(
    @Req() req: Request,
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    return this.adminService.updateUserStatus((req as any).user.id, id, status);
  }

  @Patch('users/:id/role')
  updateUserRole(
    @Req() req: Request,
    @Param('id') id: string,
    @Body('role') role: string,
  ) {
    return this.adminService.updateUserRole((req as any).user.id, id, role);
  }

  @Get('reports')
  getReports(
    @Req() req: Request,
    @Query('status') status?: string,
    @Query('targetType') targetType?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getReports((req as any).user.id, {
      status, targetType,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    });
  }

  @Patch('reports/:id/resolve')
  resolveReport(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: { status: string; resolution: string },
  ) {
    return this.adminService.resolveReport((req as any).user.id, id, body);
  }

  @Get('logs')
  getAdminLogs(
    @Req() req: Request,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getAdminLogs(
      (req as any).user.id,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 50,
    );
  }
}
