import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async trackActivity(data: {
    userId: string;
    action: string;
    metadata?: any;
    ipAddress?: string;
    userAgent?: string;
  }) {
    return this.prisma.userActivity.create({ data });
  }

  async getUserActivity(userId: string, days = 30) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return this.prisma.userActivity.findMany({
      where: { userId, createdAt: { gte: since } },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  async getDailyStats(days = 30) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return this.prisma.platformAnalytics.findMany({
      where: { date: { gte: since } },
      orderBy: { date: 'asc' },
    });
  }

  async generateDailySnapshot() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

    const [
      totalUsers, newUsers, activeUsers,
      totalListings, newListings,
      totalAuctions, activeAuctions, totalBids,
      totalMessages, totalSessions,
      revenue, tksCirculating,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { createdAt: { gte: yesterday } } }),
      this.prisma.userActivity.groupBy({
        by: ['userId'],
        where: { createdAt: { gte: yesterday } },
      }).then((r: any[]) => r.length),
      this.prisma.listing.count(),
      this.prisma.listing.count({ where: { createdAt: { gte: yesterday } } }),
      this.prisma.auction.count(),
      this.prisma.auction.count({ where: { status: 'ACTIVE' } }),
      this.prisma.bid.count({ where: { createdAt: { gte: yesterday } } }),
      this.prisma.message.count({ where: { createdAt: { gte: yesterday } } }),
      this.prisma.mentorshipSession.count({
        where: { status: 'COMPLETED', completedAt: { gte: yesterday } },
      }),
      this.prisma.payment.aggregate({
        where: { status: 'COMPLETED', createdAt: { gte: yesterday } },
        _sum: { amount: true },
      }),
      this.prisma.tksWallet.aggregate({ _sum: { balance: true } }),
    ]);

    return this.prisma.platformAnalytics.upsert({
      where: { date: today },
      create: {
        date: today,
        totalUsers, newUsers, activeUsers,
        totalListings, newListings,
        totalAuctions, activeAuctions, totalBids,
        totalMessages, totalSessions,
        totalRevenue: revenue._sum.amount || 0,
        totalTksCirculating: tksCirculating._sum.balance || 0,
      },
      update: {
        totalUsers, newUsers, activeUsers,
        totalListings, newListings,
        totalAuctions, activeAuctions, totalBids,
        totalMessages, totalSessions,
        totalRevenue: revenue._sum.amount || 0,
        totalTksCirculating: tksCirculating._sum.balance || 0,
      },
    });
  }

  async getTopActions(days = 7) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const actions = await this.prisma.userActivity.groupBy({
      by: ['action'],
      where: { createdAt: { gte: since } },
      _count: { action: true },
      orderBy: { _count: { action: 'desc' } },
      take: 10,
    });
    return actions.map((a: any) => ({ action: a.action, count: a._count.action }));
  }

  async getRevenueChart(days = 30) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return this.prisma.platformAnalytics.findMany({
      where: { date: { gte: since } },
      select: { date: true, totalRevenue: true, newUsers: true },
      orderBy: { date: 'asc' },
    });
  }

  async getGrowthMetrics() {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [usersThisMonth, usersLastMonth, revenueThisMonth, revenueLastMonth] =
      await Promise.all([
        this.prisma.user.count({ where: { createdAt: { gte: thisMonth } } }),
        this.prisma.user.count({
          where: { createdAt: { gte: lastMonth, lt: thisMonth } },
        }),
        this.prisma.payment.aggregate({
          where: { status: 'COMPLETED', createdAt: { gte: thisMonth } },
          _sum: { amount: true },
        }),
        this.prisma.payment.aggregate({
          where: { status: 'COMPLETED', createdAt: { gte: lastMonth, lt: thisMonth } },
          _sum: { amount: true },
        }),
      ]);

    const userGrowth = usersLastMonth > 0
      ? ((usersThisMonth - usersLastMonth) / usersLastMonth) * 100
      : 100;
    const revThis = revenueThisMonth._sum.amount || 0;
    const revLast = revenueLastMonth._sum.amount || 0;
    const revenueGrowth = revLast > 0 ? ((revThis - revLast) / revLast) * 100 : 100;

    return {
      users: { thisMonth: usersThisMonth, lastMonth: usersLastMonth, growth: Math.round(userGrowth) },
      revenue: { thisMonth: revThis, lastMonth: revLast, growth: Math.round(revenueGrowth) },
    };
  }

  /**
   * User dashboard stats — personalised overview for the logged-in user
   */
  async getUserDashboard(clerkId: string) {
    const user = await this.prisma.user.findUnique({
      where: { clerkId },
      include: {
        tksWallet: true,
        membership: true,
        _count: {
          select: {
            listings: true,
            forumPosts: true,
            connectionsInitiated: true,
            connectionsReceived: true,
            bookmarks: true,
            badges: true,
            mentorshipSessions: true,
            eventsCreated: true,
            groupMemberships: true,
            eventRsvps: true,
          },
        },
      },
    });

    if (!user) return null;

    // Unread notifications
    const unreadNotifications = await this.prisma.notification.count({
      where: { userId: user.id, isRead: false },
    });

    // Unread messages
    const conversations = await this.prisma.conversationParticipant.findMany({
      where: { userId: user.id },
      select: { conversationId: true },
    });
    const convIds = conversations.map((c: any) => c.conversationId);
    const unreadMessages = convIds.length > 0
      ? await this.prisma.message.count({
          where: {
            conversationId: { in: convIds },
            senderId: { not: user.id },
            readReceipts: { none: { userId: user.id } },
          },
        })
      : 0;

    // Recent activity count (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentActivity = await this.prisma.activityFeedItem.count({
      where: { userId: user.id, createdAt: { gte: sevenDaysAgo } },
    });

    return {
      user: {
        id: user.id,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        avatarUrl: user.avatarUrl,
        accountType: user.accountType,
        memberSince: user.createdAt,
        profileViews: user.profileViews,
      },
      membership: user.membership ? {
        plan: user.membership.plan,
        status: user.membership.status,
        expiresAt: user.membership.expiresAt,
      } : null,
      tokens: {
        balance: user.tksWallet?.balance || 0,
        totalEarned: user.tksWallet?.totalEarned || 0,
        totalSpent: user.tksWallet?.totalSpent || 0,
      },
      stats: {
        listings: user._count.listings,
        forumPosts: user._count.forumPosts,
        connections: user._count.connectionsInitiated + user._count.connectionsReceived,
        bookmarks: user._count.bookmarks,
        badges: user._count.badges,
        mentorshipSessions: user._count.mentorshipSessions,
        events: user._count.eventsCreated + user._count.eventRsvps,
        groups: user._count.groupMemberships,
      },
      notifications: { unread: unreadNotifications },
      messages: { unread: unreadMessages },
      recentActivity,
    };
  }
}
