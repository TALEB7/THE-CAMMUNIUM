import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BadgesService {
  constructor(private prisma: PrismaService) {}

  // ── Badge CRUD (Admin) ──

  async createBadge(data: {
    name: string;
    slug: string;
    description?: string;
    icon?: string;
    color?: string;
    category?: string;
    xpReward?: number;
    criteria?: any;
    isSecret?: boolean;
  }) {
    return this.prisma.badge.create({ data });
  }

  async updateBadge(id: string, data: Partial<{
    name: string;
    description: string;
    icon: string;
    color: string;
    category: string;
    xpReward: number;
    criteria: any;
    isSecret: boolean;
    sortOrder: number;
  }>) {
    return this.prisma.badge.update({ where: { id }, data });
  }

  async deleteBadge(id: string) {
    return this.prisma.badge.delete({ where: { id } });
  }

  // ── Browse Badges ──

  async getAllBadges(includeSecret = false) {
    return this.prisma.badge.findMany({
      where: includeSecret ? {} : { isSecret: false },
      include: { _count: { select: { users: true } } },
      orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }],
    });
  }

  async getBadgeById(id: string) {
    return this.prisma.badge.findUnique({
      where: { id },
      include: {
        users: {
          include: {
            user: { select: { id: true, clerkId: true, firstName: true, lastName: true, avatarUrl: true } },
          },
          orderBy: { awardedAt: 'desc' },
          take: 20,
        },
        _count: { select: { users: true } },
      },
    });
  }

  // ── User Badges ──

  async getUserBadges(userId: string) {
    return this.prisma.userBadge.findMany({
      where: { user: { clerkId: userId } },
      include: { badge: true },
      orderBy: { awardedAt: 'desc' },
    });
  }

  async awardBadge(userId: string, badgeId: string, awardedBy?: string) {
    const user = await this.prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) throw new Error('User not found');

    return this.prisma.userBadge.upsert({
      where: { userId_badgeId: { userId: user.id, badgeId } },
      update: {},
      create: { userId: user.id, badgeId, awardedBy },
      include: { badge: true },
    });
  }

  async revokeBadge(userId: string, badgeId: string) {
    const user = await this.prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) return;

    return this.prisma.userBadge.deleteMany({
      where: { userId: user.id, badgeId },
    });
  }

  // ── Leaderboard ──

  async getLeaderboard(limit = 20) {
    const users = await this.prisma.user.findMany({
      where: { isActive: true },
      select: {
        id: true,
        clerkId: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        _count: {
          select: {
            badges: true,
            forumPosts: true,
            listings: true,
            activityFeedItems: true,
          },
        },
      },
      orderBy: { badges: { _count: 'desc' } },
      take: limit,
    });

    return users.map((u: any, i: number) => ({
      rank: i + 1,
      user: {
        id: u.id,
        clerkId: u.clerkId,
        firstName: u.firstName,
        lastName: u.lastName,
        avatarUrl: u.avatarUrl,
      },
      stats: {
        badges: u._count.badges,
        posts: u._count.forumPosts,
        listings: u._count.listings,
        activities: u._count.activityFeedItems,
        xp: u._count.badges * 50 + u._count.forumPosts * 10 + u._count.listings * 20,
      },
    }));
  }

  // ── Auto-check criteria (called after certain actions) ──

  async checkAndAwardBadges(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { clerkId: userId },
      include: {
        _count: {
          select: {
            forumPosts: true,
            listings: true,
            connectionsInitiated: true,
            connectionsReceived: true,
            groupMemberships: true,
            eventsCreated: true,
            mentorshipSessions: true,
          },
        },
        badges: { select: { badgeId: true } },
      },
    });
    if (!user) return [];

    const badges = await this.prisma.badge.findMany({ where: { criteria: { not: (Prisma as any).DbNull ?? null } } });
    const ownedBadgeIds = new Set(user.badges.map((b: any) => b.badgeId));
    const awarded: string[] = [];

    for (const badge of badges) {
      if (ownedBadgeIds.has(badge.id)) continue;
      const criteria = badge.criteria as any;
      if (!criteria?.type || !criteria?.threshold) continue;

      let count = 0;
      switch (criteria.type) {
        case 'forum_posts': count = user._count.forumPosts; break;
        case 'listings': count = user._count.listings; break;
        case 'connections': count = user._count.connectionsInitiated + user._count.connectionsReceived; break;
        case 'groups': count = user._count.groupMemberships; break;
        case 'events': count = user._count.eventsCreated; break;
        case 'mentorship_sessions': count = user._count.mentorshipSessions; break;
      }

      if (count >= criteria.threshold) {
        await this.prisma.userBadge.create({ data: { userId: user.id, badgeId: badge.id } });
        awarded.push(badge.name);
      }
    }

    return awarded;
  }
}
