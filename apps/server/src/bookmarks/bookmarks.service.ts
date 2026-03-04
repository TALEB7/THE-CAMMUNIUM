import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BookmarksService {
  constructor(private prisma: PrismaService) {}

  // ── Toggle Bookmark ──

  async toggleBookmark(userId: string, targetType: string, targetId: string, note?: string) {
    const user = await this.prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) throw new Error('User not found');

    const existing = await this.prisma.bookmark.findUnique({
      where: { userId_targetType_targetId: { userId: user.id, targetType, targetId } },
    });

    if (existing) {
      await this.prisma.bookmark.delete({ where: { id: existing.id } });
      return { bookmarked: false };
    }

    await this.prisma.bookmark.create({
      data: { userId: user.id, targetType, targetId, note },
    });
    return { bookmarked: true };
  }

  // ── Get user bookmarks ──

  async getUserBookmarks(userId: string, targetType?: string, page = 1, limit = 20) {
    const user = await this.prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) return { bookmarks: [], total: 0 };

    const where: any = { userId: user.id };
    if (targetType) where.targetType = targetType;

    const [bookmarks, total] = await Promise.all([
      this.prisma.bookmark.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.bookmark.count({ where }),
    ]);

    // Enrich with target details
    const enriched = await Promise.all(
      bookmarks.map(async (bm: any) => {
        let target: any = null;
        try {
          switch (bm.targetType) {
            case 'LISTING':
              target = await this.prisma.listing.findUnique({
                where: { id: bm.targetId },
                select: { id: true, title: true, price: true, images: true, status: true },
              });
              break;
            case 'FORUM_POST':
              target = await this.prisma.forumPost.findUnique({
                where: { id: bm.targetId },
                select: { id: true, title: true, slug: true, viewCount: true },
              });
              break;
            case 'EVENT':
              target = await this.prisma.event.findUnique({
                where: { id: bm.targetId },
                select: { id: true, title: true, startDate: true, city: true, eventType: true },
              });
              break;
            case 'GROUP':
              target = await this.prisma.group.findUnique({
                where: { id: bm.targetId },
                select: { id: true, name: true, slug: true, memberCount: true },
              });
              break;
            case 'POLL':
              target = await this.prisma.poll.findUnique({
                where: { id: bm.targetId },
                select: { id: true, question: true, totalVotes: true, status: true },
              });
              break;
          }
        } catch (e) { /* target may be deleted */ }
        return { ...bm, target };
      }),
    );

    return { bookmarks: enriched, total, page, totalPages: Math.ceil(total / limit) };
  }

  // ── Check if bookmarked ──

  async isBookmarked(userId: string, targetType: string, targetId: string) {
    const user = await this.prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) return false;

    const bm = await this.prisma.bookmark.findUnique({
      where: { userId_targetType_targetId: { userId: user.id, targetType, targetId } },
    });
    return !!bm;
  }

  // ── Update note ──

  async updateNote(userId: string, bookmarkId: string, note: string) {
    const user = await this.prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) throw new Error('User not found');

    return this.prisma.bookmark.update({
      where: { id: bookmarkId, userId: user.id },
      data: { note },
    });
  }

  // ── Stats ──

  async getBookmarkStats(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) return {};

    const counts = await this.prisma.bookmark.groupBy({
      by: ['targetType'],
      where: { userId: user.id },
      _count: true,
    });

    const byType: Record<string, number> = {};
    let total = 0;
    for (const c of counts) {
      byType[c.targetType] = c._count;
      total += c._count;
    }

    return { total, byType };
  }
}
