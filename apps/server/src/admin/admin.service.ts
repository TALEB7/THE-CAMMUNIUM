import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  private async assertAdmin(userId: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { id: userId },
          { clerkId: userId },
        ],
      },
    });
    if (!user || user.role !== 'ADMIN') {
      throw new ForbiddenException('Acces refuse: admin requis');
    }
    return user;
  }

  // -- Dashboard Stats --
  async getDashboardStats(adminId: string) {
    await this.assertAdmin(adminId);

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalUsers, newUsers7d, newUsers30d,
      totalListings, activeListings,
      totalAuctions, activeAuctions,
      totalPayments, revenue30d,
      totalMessages,
      totalMentors, activeSessions,
      pendingReports,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      this.prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      this.prisma.listing.count(),
      this.prisma.listing.count({ where: { status: 'ACTIVE' } }),
      this.prisma.auction.count(),
      this.prisma.auction.count({ where: { status: 'ACTIVE' } }),
      this.prisma.payment.count({ where: { status: 'COMPLETED' } }),
      this.prisma.payment.aggregate({
        where: { status: 'COMPLETED', createdAt: { gte: thirtyDaysAgo } },
        _sum: { amount: true },
      }),
      this.prisma.message.count(),
      this.prisma.mentorProfile.count({ where: { isAvailable: true } }),
      this.prisma.mentorshipSession.count({ where: { status: 'SCHEDULED' } }),
      this.prisma.report.count({ where: { status: 'PENDING' } }),
    ]);

    return {
      users: { total: totalUsers, new7d: newUsers7d, new30d: newUsers30d },
      listings: { total: totalListings, active: activeListings },
      auctions: { total: totalAuctions, active: activeAuctions },
      payments: { total: totalPayments, revenue30d: revenue30d._sum.amount || 0 },
      messages: { total: totalMessages },
      mentorship: { totalMentors, activeSessions },
      reports: { pending: pendingReports },
    };
  }

  // -- User Management --
  async getUsers(adminId: string, filters: {
    search?: string; role?: string; status?: string;
    page?: number; limit?: number;
  }) {
    await this.assertAdmin(adminId);
    const { page = 1, limit = 20 } = filters;
    const where: any = {};

    if (filters.search) {
      where.OR = [
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
      ];
    }
    if (filters.role) where.role = filters.role;
    if (filters.status) where.status = filters.status;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include: {
          membership: true,
          tksWallet: true,
          _count: { select: { listings: true, payments: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return { users, total, page, totalPages: Math.ceil(total / limit) };
  }

  async updateUserStatus(adminId: string, targetUserId: string, status: string) {
    await this.assertAdmin(adminId);

    const user = await this.prisma.user.update({
      where: { id: targetUserId },
      data: { status },
    });

    await this.prisma.adminLog.create({
      data: {
        adminId,
        action: status === 'BANNED' ? 'USER_BANNED' : 'USER_STATUS_CHANGED',
        target: 'USER',
        targetId: targetUserId,
        details: { newStatus: status },
      },
    });

    return user;
  }

  async updateUserRole(adminId: string, targetUserId: string, role: string) {
    await this.assertAdmin(adminId);

    const user = await this.prisma.user.update({
      where: { id: targetUserId },
      data: { role },
    });

    await this.prisma.adminLog.create({
      data: {
        adminId,
        action: 'USER_ROLE_CHANGED',
        target: 'USER',
        targetId: targetUserId,
        details: { newRole: role },
      },
    });

    return user;
  }

  // -- Reports --
  async getReports(adminId: string, filters: {
    status?: string; targetType?: string; page?: number; limit?: number;
  }) {
    await this.assertAdmin(adminId);
    const { page = 1, limit = 20 } = filters;
    const where: any = {};

    if (filters.status) where.status = filters.status;
    if (filters.targetType) where.targetType = filters.targetType;

    const [reports, total] = await Promise.all([
      this.prisma.report.findMany({
        where,
        include: {
          reporter: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.report.count({ where }),
    ]);

    return { reports, total, page, totalPages: Math.ceil(total / limit) };
  }

  async resolveReport(adminId: string, reportId: string, data: { status: string; resolution: string }) {
    await this.assertAdmin(adminId);

    const report = await this.prisma.report.update({
      where: { id: reportId },
      data: {
        status: data.status,
        resolution: data.resolution,
        resolvedBy: adminId,
        resolvedAt: new Date(),
      },
    });

    await this.prisma.adminLog.create({
      data: {
        adminId,
        action: 'REPORT_RESOLVED',
        target: 'REPORT',
        targetId: reportId,
        details: data,
      },
    });

    return report;
  }

  // -- Admin Logs --
  async getAdminLogs(adminId: string, page = 1, limit = 50) {
    await this.assertAdmin(adminId);

    const [logs, total] = await Promise.all([
      this.prisma.adminLog.findMany({
        include: {
          admin: { select: { firstName: true, lastName: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.adminLog.count(),
    ]);

    return { logs, total, page, totalPages: Math.ceil(total / limit) };
  }
}
