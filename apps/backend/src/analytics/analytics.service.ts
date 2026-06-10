import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
  ) {}

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
   * Trending categories — pre-aggregate UserActivity (LISTING_VIEW, SEARCH)
   * into per-category daily buckets and send to the AI trending engine.
   * Results are advisory; cache server-side if needed.
   */
  /**
   * Churn prediction for a batch of users (or all active users if no ids given).
   * Aggregates UserActivity, TksWallet, Membership, and listing/session counts
   * then delegates scoring to the AI service RFM model.
   */
  async getChurnRisk(userIds?: string[], riskFilter?: string): Promise<any> {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const where: any = userIds?.length ? { id: { in: userIds } } : {};

    const users = await this.prisma.user.findMany({
      where,
      select: {
        id: true,
        createdAt: true,
        tksWallet: { select: { totalSpent: true } },
        membership: { select: { status: true, plan: true } },
        _count: { select: { listings: true, mentorshipSessions: true } },
      },
      take: 500,
    });

    if (users.length === 0) return { predictions: [], high_risk_count: 0, medium_risk_count: 0, low_risk_count: 0 };

    // Get last activity date and 30-day action count per user in one query each
    const userIds_ = users.map((u) => u.id);

    const lastActivities = await this.prisma.userActivity.groupBy({
      by: ['userId'],
      where: { userId: { in: userIds_ } },
      _max: { createdAt: true },
    });

    const recentActivityCounts = await this.prisma.userActivity.groupBy({
      by: ['userId'],
      where: { userId: { in: userIds_ }, createdAt: { gte: thirtyDaysAgo } },
      _count: { id: true },
    });

    const lastActivityMap = new Map(lastActivities.map((a: any) => [a.userId, a._max.createdAt]));
    const activityCountMap = new Map(recentActivityCounts.map((a: any) => [a.userId, a._count.id]));

    // Monthly value per membership plan (in platform currency units)
    const PLAN_MONTHLY_VALUE: Record<string, number> = {
      personal_premium: 29,
      business_premium: 59,
      company_creation: 99,
    };

    const payload = users.map((u) => {
      const lastActive = lastActivityMap.get(u.id) as Date | undefined;
      const daysSinceLast = lastActive
        ? (now.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24)
        : 999;
      const accountAgeDays = Math.round((now.getTime() - u.createdAt.getTime()) / (1000 * 60 * 60 * 24));
      const accountAgeMonths = Math.max(accountAgeDays / 30, 1);
      const totalSpent = u.tksWallet?.totalSpent ?? 0;
      const isActiveMember = u.membership?.status === 'ACTIVE';

      return {
        user_id:            u.id,
        days_since_last:    Math.round(daysSinceLast),
        action_count_30d:   activityCountMap.get(u.id) ?? 0,
        listing_count:      u._count.listings,
        session_count:      u._count.mentorshipSessions,
        tks_spent:          totalSpent,
        account_age_days:   accountAgeDays,
        membership_active:  isActiveMember,
        monthly_tks_spent:  Math.round((totalSpent / accountAgeMonths) * 100) / 100,
        membership_revenue: isActiveMember
          ? (PLAN_MONTHLY_VALUE[u.membership!.plan] ?? 0)
          : 0,
      };
    });

    const result = await this.aiService.predictChurn(payload);
    if (!result) return { predictions: [], high_risk_count: 0, medium_risk_count: 0, low_risk_count: 0 };

    // Optionally filter by risk level
    if (riskFilter) {
      result.predictions = result.predictions.filter(
        (p: any) => p.risk_level === riskFilter.toUpperCase(),
      );
    }

    return result;
  }

  async getTrendingCategories(windowDays = 7, topK = 10): Promise<any> {
    const since = new Date(Date.now() - windowDays * 2 * 24 * 60 * 60 * 1000); // 2× window for growth comparison

    // Aggregate listing views per category per day from UserActivity
    const viewActivities = await this.prisma.userActivity.findMany({
      where: {
        action: 'LISTING_VIEW',
        createdAt: { gte: since },
        metadata: { not: undefined },
      },
      select: { metadata: true, createdAt: true },
    });

    const searchActivities = await this.prisma.userActivity.findMany({
      where: { action: 'SEARCH', createdAt: { gte: since } },
      select: { metadata: true, createdAt: true },
    });

    // Aggregate listing counts per category
    const listingCounts = await this.prisma.listing.groupBy({
      by: ['categoryId'],
      where: { status: 'ACTIVE' },
      _count: { id: true },
    });

    const categories = await this.prisma.category.findMany({ select: { id: true, name: true } });
    const categoryMap = new Map(categories.map((c) => [c.id, c.name]));
    const listingCountMap = new Map(listingCounts.map((l: any) => [l.categoryId, l._count.id]));

    // Build per-category per-date buckets
    type Bucket = { view_count: number; search_count: number; listing_count: number };
    const buckets = new Map<string, Map<string, Bucket>>(); // category → date → bucket

    const dateKey = (d: Date) => d.toISOString().slice(0, 10);

    for (const act of viewActivities) {
      const meta = act.metadata as any;
      const catId = meta?.categoryId as string | undefined;
      if (!catId) continue;
      const catName = categoryMap.get(catId);
      if (!catName) continue;
      const dk = dateKey(act.createdAt);
      if (!buckets.has(catName)) buckets.set(catName, new Map());
      const dayMap = buckets.get(catName)!;
      if (!dayMap.has(dk)) dayMap.set(dk, { view_count: 0, search_count: 0, listing_count: listingCountMap.get(catId) ?? 0 });
      dayMap.get(dk)!.view_count++;
    }

    for (const act of searchActivities) {
      const meta = act.metadata as any;
      const catName = meta?.category as string | undefined;
      if (!catName) continue;
      const dk = dateKey(act.createdAt);
      if (!buckets.has(catName)) buckets.set(catName, new Map());
      const dayMap = buckets.get(catName)!;
      if (!dayMap.has(dk)) dayMap.set(dk, { view_count: 0, search_count: 0, listing_count: 0 });
      dayMap.get(dk)!.search_count++;
    }

    // Flatten to data points array
    const dataPoints: Array<{ category: string; date: string; view_count: number; search_count: number; listing_count: number }> = [];
    for (const [category, dayMap] of buckets.entries()) {
      for (const [date, counts] of dayMap.entries()) {
        dataPoints.push({ category, date, ...counts });
      }
    }

    if (dataPoints.length === 0) return { trending: [], computed_at: new Date().toISOString() };

    return this.aiService.getTrendingCategories({ dataPoints, topK, windowDays });
  }

  /**
   * User dashboard stats — personalised overview for the logged-in user
   */
  async getUserDashboard(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
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
