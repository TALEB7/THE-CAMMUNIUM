import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ActivityFeedService {
  constructor(private prisma: PrismaService) {}

  // ── Get global feed (latest public activity) ──

  async getGlobalFeed(page = 1, limit = 30) {
    const [items, total] = await Promise.all([
      this.prisma.activityFeedItem.findMany({
        where: { isPublic: true },
        include: {
          user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.activityFeedItem.count({ where: { isPublic: true } }),
    ]);
    return { items, total, page, totalPages: Math.ceil(total / limit) };
  }

  // ── Get personal feed (from user connections) ──

  async getPersonalFeed(userId: string, page = 1, limit = 30) {
    // Get user connections
    const connections = await this.prisma.connection.findMany({
      where: {
        status: 'ACCEPTED',
        OR: [{ fromId: userId }, { toId: userId }],
      },
      select: { fromId: true, toId: true },
    });

    const connectedUserIds = new Set<string>();
    connectedUserIds.add(userId); // Include own activity
    connections.forEach((c) => {
      connectedUserIds.add(c.fromId);
      connectedUserIds.add(c.toId);
    });

    const [items, total] = await Promise.all([
      this.prisma.activityFeedItem.findMany({
        where: {
          userId: { in: Array.from(connectedUserIds) },
          isPublic: true,
        },
        include: {
          user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.activityFeedItem.count({
        where: {
          userId: { in: Array.from(connectedUserIds) },
          isPublic: true,
        },
      }),
    ]);
    return { items, total, page, totalPages: Math.ceil(total / limit) };
  }

  // ── Get user activity ──

  async getUserFeed(userId: string, page = 1, limit = 20) {
    const [items, total] = await Promise.all([
      this.prisma.activityFeedItem.findMany({
        where: { userId, isPublic: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.activityFeedItem.count({ where: { userId, isPublic: true } }),
    ]);
    return { items, total, page, totalPages: Math.ceil(total / limit) };
  }

  // ── Publish activity ──

  async publishActivity(data: {
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
    return this.prisma.activityFeedItem.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title,
        body: data.body,
        entityType: data.entityType,
        entityId: data.entityId,
        imageUrl: data.imageUrl,
        metadata: data.metadata,
        isPublic: data.isPublic ?? true,
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      },
    });
  }

  // ── Delete activity ──

  async deleteActivity(id: string, userId: string) {
    return this.prisma.activityFeedItem.deleteMany({ where: { id, userId } });
  }

  // ── Feed stats ──

  async getFeedStats(userId: string) {
    const [totalPosts, totalEvents, totalConnections] = await Promise.all([
      this.prisma.activityFeedItem.count({ where: { userId, type: 'POST' } }),
      this.prisma.activityFeedItem.count({ where: { userId, type: 'EVENT' } }),
      this.prisma.connection.count({
        where: { status: 'ACCEPTED', OR: [{ fromId: userId }, { toId: userId }] },
      }),
    ]);
    return { totalPosts, totalEvents, totalConnections };
  }
}
