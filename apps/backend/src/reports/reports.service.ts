import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async createReport(data: {
    reporterId: string;
    targetType: string;
    targetId: string;
    reason: string;
    description?: string;
  }) {
    return this.prisma.report.create({ data });
  }

  async getUserReports(userId: string) {
    return this.prisma.report.findMany({
      where: { reporterId: userId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
