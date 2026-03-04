import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnnouncementsService {
  constructor(private prisma: PrismaService) {}

  // ── Create (Admin) ──

  async create(data: {
    authorId: string;
    title: string;
    content: string;
    type?: string;
    priority?: number;
    isPinned?: boolean;
    isPublished?: boolean;
    expiresAt?: string;
    targetAudience?: string;
    imageUrl?: string;
    linkUrl?: string;
    linkLabel?: string;
  }) {
    return this.prisma.announcement.create({
      data: {
        ...data,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        publishedAt: data.isPublished ? new Date() : null,
      },
    });
  }

  async update(id: string, data: any) {
    if (data.isPublished && !data.publishedAt) {
      data.publishedAt = new Date();
    }
    if (data.expiresAt) data.expiresAt = new Date(data.expiresAt);
    return this.prisma.announcement.update({ where: { id }, data });
  }

  async delete(id: string) {
    return this.prisma.announcement.delete({ where: { id } });
  }

  // ── Public: Browse ──

  async getPublished(page = 1, limit = 10) {
    const now = new Date();
    const where: any = {
      isPublished: true,
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    };

    const [announcements, total] = await Promise.all([
      this.prisma.announcement.findMany({
        where,
        orderBy: [{ isPinned: 'desc' }, { priority: 'desc' }, { publishedAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
        include: { _count: { select: { reads: true } } },
      }),
      this.prisma.announcement.count({ where }),
    ]);

    return { announcements, total, page, totalPages: Math.ceil(total / limit) };
  }

  async getById(id: string) {
    await this.prisma.announcement.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    return this.prisma.announcement.findUnique({
      where: { id },
      include: { _count: { select: { reads: true } } },
    });
  }

  // ── Mark as read ──

  async markRead(announcementId: string, userId: string) {
    const user = await this.prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) return;

    return this.prisma.announcementRead.upsert({
      where: { announcementId_userId: { announcementId, userId: user.id } },
      update: {},
      create: { announcementId, userId: user.id },
    });
  }

  async getUnreadCount(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) return 0;

    const now = new Date();
    const totalPublished = await this.prisma.announcement.count({
      where: {
        isPublished: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
    });

    const read = await this.prisma.announcementRead.count({
      where: { userId: user.id },
    });

    return Math.max(0, totalPublished - read);
  }

  // ── Admin: all announcements ──

  async getAll(page = 1, limit = 20) {
    const [announcements, total] = await Promise.all([
      this.prisma.announcement.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { _count: { select: { reads: true } } },
      }),
      this.prisma.announcement.count(),
    ]);

    return { announcements, total, page, totalPages: Math.ceil(total / limit) };
  }
}
