import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RecommendationsService {
  constructor(private prisma: PrismaService) {}

  // Generate recommendations for a user based on their activity
  async generateRecommendations(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        personalProfile: { select: { interests: true } },
        favoriteListings: { include: { listing: { select: { categoryId: true, tags: true } } } },
        bids: { include: { auction: { include: { listing: { select: { categoryId: true } } } } }, take: 10 },
      },
    });

    if (!user) return [];

    // Collect user interests / favorite categories
    const interests = user.personalProfile?.interests || [];
    const favoriteCategoryIds = user.favoriteListings.map((f) => f.listing.categoryId);
    const bidCategoryIds = user.bids.map((b) => b.auction.listing.categoryId);
    const allCategoryIds = [...new Set([...favoriteCategoryIds, ...bidCategoryIds])];
    const allTags = [
      ...new Set(user.favoriteListings.flatMap((f) => f.listing.tags)),
    ];

    // Clear old non-viewed recommendations
    await this.prisma.recommendation.deleteMany({
      where: { userId, isViewed: false, isDismissed: false },
    });

    // Find listings the user hasn't seen
    const existingListingIds = (
      await this.prisma.recommendation.findMany({
        where: { userId },
        select: { listingId: true },
      })
    ).map((r) => r.listingId);

    const ownListingIds = (
      await this.prisma.listing.findMany({
        where: { sellerId: userId },
        select: { id: true },
      })
    ).map((l) => l.id);

    const excludeIds = [...existingListingIds, ...ownListingIds];

    // Strategy 1: Category match
    let categoryListings: any[] = [];
    if (allCategoryIds.length > 0) {
      categoryListings = await this.prisma.listing.findMany({
        where: {
          status: 'ACTIVE',
          categoryId: { in: allCategoryIds },
          id: { notIn: excludeIds },
        },
        take: 10,
        orderBy: { createdAt: 'desc' },
      });
    }

    // Strategy 2: Interest/tag match
    let tagListings: any[] = [];
    if (allTags.length > 0 || interests.length > 0) {
      tagListings = await this.prisma.listing.findMany({
        where: {
          status: 'ACTIVE',
          id: { notIn: [...excludeIds, ...categoryListings.map((l) => l.id)] },
          OR: [
            ...(allTags.length > 0 ? [{ tags: { hasSome: allTags } }] : []),
            ...(interests.length > 0 ? [{ tags: { hasSome: interests } }] : []),
          ],
        },
        take: 10,
        orderBy: { createdAt: 'desc' },
      });
    }

    // Strategy 3: Trending (most viewed)
    const trendingListings = await this.prisma.listing.findMany({
      where: {
        status: 'ACTIVE',
        id: { notIn: [...excludeIds, ...categoryListings.map((l) => l.id), ...tagListings.map((l) => l.id)] },
      },
      take: 5,
      orderBy: { viewCount: 'desc' },
    });

    // Build recommendation entries
    const recommendations: any[] = [];
    for (const listing of categoryListings) {
      recommendations.push({
        userId,
        listingId: listing.id,
        score: 0.8,
        reason: 'CATEGORY_HISTORY',
      });
    }
    for (const listing of tagListings) {
      recommendations.push({
        userId,
        listingId: listing.id,
        score: 0.6,
        reason: 'INTEREST_MATCH',
      });
    }
    for (const listing of trendingListings) {
      recommendations.push({
        userId,
        listingId: listing.id,
        score: 0.4,
        reason: 'TRENDING',
      });
    }

    if (recommendations.length > 0) {
      await this.prisma.recommendation.createMany({
        data: recommendations,
        skipDuplicates: true,
      });
    }

    return { generated: recommendations.length };
  }

  // Get user recommendations
  async getUserRecommendations(userId: string, page = 1, limit = 20) {
    const [items, total] = await Promise.all([
      this.prisma.recommendation.findMany({
        where: { userId, isDismissed: false },
        include: {
          listing: {
            include: {
              seller: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
              category: { select: { id: true, name: true, slug: true } },
              _count: { select: { favorites: true } },
            },
          },
        },
        orderBy: { score: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.recommendation.count({ where: { userId, isDismissed: false } }),
    ]);

    return { recommendations: items, total, page, totalPages: Math.ceil(total / limit) };
  }

  // Mark as viewed
  async markViewed(id: string) {
    return this.prisma.recommendation.update({
      where: { id },
      data: { isViewed: true },
    });
  }

  // Dismiss recommendation
  async dismiss(id: string) {
    return this.prisma.recommendation.update({
      where: { id },
      data: { isDismissed: true },
    });
  }
}
