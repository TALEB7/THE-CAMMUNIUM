import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';

@Injectable()
export class RecommendationsService {
  private readonly logger = new Logger(RecommendationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
  ) {}

  async generateRecommendations(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        personalProfile: { select: { interests: true } },
        favoriteListings: {
          include: {
            listing: {
              select: {
                id: true,
                categoryId: true,
                tags: true,
                embedding: { select: { embedding: true } },
              },
            },
          },
        },
        bids: {
          include: { auction: { include: { listing: { select: { categoryId: true } } } } },
          take: 10,
        },
      },
    });

    if (!user) return [];

    const existingListingIds = (
      await this.prisma.recommendation.findMany({
        where: { userId },
        select: { listingId: true },
      })
    ).map((r: any) => r.listingId);

    const ownListingIds = (
      await this.prisma.listing.findMany({
        where: { sellerId: userId },
        select: { id: true },
      })
    ).map((l: any) => l.id);

    const excludeIds = new Set([...existingListingIds, ...ownListingIds]);

    // Clear stale non-viewed recommendations
    await this.prisma.recommendation.deleteMany({
      where: { userId, isViewed: false, isDismissed: false },
    });

    const recommendations: any[] = [];

    // ── Strategy 0: AI — Embedding-based (MMR) ────────────────────────────
    try {
      const semanticRecs = await this._generateSemanticRecommendations(
        userId,
        user,
        excludeIds,
      );
      for (const r of semanticRecs) {
        recommendations.push(r);
        excludeIds.add(r.listingId);
      }
    } catch (err: any) {
      // AI service unavailable — log and fall through to rule-based strategies
      this.logger.warn(`Semantic recommendations unavailable for ${userId}: ${err.message}`);
    }

    // ── Strategy 1: Category history ──────────────────────────────────────
    const interests = user.personalProfile?.interests || [];
    const favoriteCategoryIds = user.favoriteListings.map((f: any) => f.listing.categoryId);
    const bidCategoryIds = user.bids.map((b: any) => b.auction.listing.categoryId);
    const allCategoryIds = [...new Set([...favoriteCategoryIds, ...bidCategoryIds])];
    const allTags = [...new Set(user.favoriteListings.flatMap((f: any) => f.listing.tags))];

    if (allCategoryIds.length > 0) {
      const categoryListings = await this.prisma.listing.findMany({
        where: {
          status: 'ACTIVE',
          categoryId: { in: allCategoryIds },
          id: { notIn: [...excludeIds] },
        },
        take: 10,
        orderBy: { createdAt: 'desc' },
      });
      for (const l of categoryListings) {
        recommendations.push({ userId, listingId: l.id, score: 0.8, reason: 'CATEGORY_HISTORY' });
        excludeIds.add(l.id);
      }
    }

    // ── Strategy 2: Interest/tag match ────────────────────────────────────
    if (allTags.length > 0 || interests.length > 0) {
      const tagListings = await this.prisma.listing.findMany({
        where: {
          status: 'ACTIVE',
          id: { notIn: [...excludeIds] },
          OR: [
            ...(allTags.length > 0 ? [{ tags: { hasSome: allTags } }] : []),
            ...(interests.length > 0 ? [{ tags: { hasSome: interests } }] : []),
          ],
        },
        take: 10,
        orderBy: { createdAt: 'desc' },
      });
      for (const l of tagListings) {
        recommendations.push({ userId, listingId: l.id, score: 0.6, reason: 'INTEREST_MATCH' });
        excludeIds.add(l.id);
      }
    }

    // ── Strategy 3: Trending (most viewed) ───────────────────────────────
    const trendingListings = await this.prisma.listing.findMany({
      where: { status: 'ACTIVE', id: { notIn: [...excludeIds] } },
      take: 5,
      orderBy: { viewCount: 'desc' },
    });
    for (const l of trendingListings) {
      recommendations.push({ userId, listingId: l.id, score: 0.4, reason: 'TRENDING' });
    }

    if (recommendations.length > 0) {
      await this.prisma.recommendation.createMany({
        data: recommendations,
        skipDuplicates: true,
      });
    }

    return { generated: recommendations.length };
  }

  /**
   * Build a user taste vector (centroid of favorited + recently viewed embeddings)
   * then call the MMR recommendation engine in the AI service.
   */
  private async _generateSemanticRecommendations(
    userId: string,
    user: any,
    excludeIds: Set<string>,
  ): Promise<any[]> {
    // 1. Collect embeddings from favorites (safely handle both string/vector and array/JSON)
    const favoriteEmbeddings: number[][] = user.favoriteListings
      .map((f: any) => {
        const emb = f.listing.embedding?.embedding;
        if (!emb) return null;
        if (typeof emb === 'string') {
          try {
            return JSON.parse(emb) as number[];
          } catch {
            return null;
          }
        }
        return emb as number[];
      })
      .filter(Boolean) as number[][];

    // 2. Collect embeddings from last 10 viewed listings
    const recentViews = await this.prisma.userActivity.findMany({
      where: { userId, action: 'LISTING_VIEW' },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { metadata: true },
    });

    const viewedListingIds = recentViews
      .map((a: any) => (a.metadata as any)?.listingId as string | undefined)
      .filter(Boolean) as string[];

    if (viewedListingIds.length > 0) {
      try {
        // $queryRawUnsafe is used because the query needs a dynamic-length IN (...) list.
        // Only positional placeholders ($1, $2...) are interpolated into the SQL text;
        // the actual values are passed as separate arguments below.
        const placeholders = viewedListingIds.map((_, i) => `$${i + 1}`).join(', ');
        const viewedEmbeddings: any[] = await this.prisma.$queryRawUnsafe(`
          SELECT "listingId", (embedding::text) as embedding 
          FROM listing_embeddings 
          WHERE "listingId" IN (${placeholders})
        `, ...viewedListingIds);

        for (const e of viewedEmbeddings) {
          if (e.embedding) {
            try {
              favoriteEmbeddings.push(JSON.parse(e.embedding) as number[]);
            } catch {
              // ignore parse errors
            }
          }
        }
      } catch (err: any) {
        this.logger.warn(`Failed to retrieve viewed embeddings via raw query: ${err.message}`);
      }
    }

    if (favoriteEmbeddings.length === 0) return [];

    // 3. Centroid = mean of all embeddings, then L2-normalise
    const dim = favoriteEmbeddings[0].length;
    const centroid = new Array(dim).fill(0);
    for (const emb of favoriteEmbeddings) {
      for (let i = 0; i < dim; i++) centroid[i] += emb[i];
    }
    for (let i = 0; i < dim; i++) centroid[i] /= favoriteEmbeddings.length;

    const norm = Math.sqrt(centroid.reduce((s, v) => s + v * v, 0));
    const unitCentroid = norm > 0 ? centroid.map((v) => v / norm) : centroid;

    // 4. Load up to 500 candidate embeddings (active, unseen by this user) via raw SQL
    let candidates: any[] = [];
    try {
      const excludeList = [...excludeIds];
      if (excludeList.length > 0) {
        // $queryRawUnsafe is used because the query needs a dynamic-length NOT IN (...) list.
        // Only positional placeholders ($1, $2...) are interpolated into the SQL text;
        // the actual values are passed as separate arguments below.
        const placeholders = excludeList.map((_, i) => `$${i + 2}`).join(', ');
        candidates = await this.prisma.$queryRawUnsafe(`
          SELECT le."listingId", (le.embedding::text) as embedding
          FROM listing_embeddings le
          INNER JOIN listings l ON l.id = le."listingId"
          WHERE l.status = 'ACTIVE' AND l."sellerId" <> $1 AND le."listingId" NOT IN (${placeholders})
          LIMIT 500
        `, userId, ...excludeList);
      } else {
        candidates = await this.prisma.$queryRawUnsafe(`
          SELECT le."listingId", (le.embedding::text) as embedding
          FROM listing_embeddings le
          INNER JOIN listings l ON l.id = le."listingId"
          WHERE l.status = 'ACTIVE' AND l."sellerId" <> $1
          LIMIT 500
        `, userId);
      }
    } catch (err: any) {
      this.logger.warn(`Failed to retrieve candidate embeddings via raw query: ${err.message}`);
      return [];
    }

    const candidatesPayload = candidates
      .map((c) => {
        try {
          return {
            listing_id: c.listingId,
            embedding: JSON.parse(c.embedding) as number[],
          };
        } catch {
          return null;
        }
      })
      .filter(Boolean) as Array<{ listing_id: string; embedding: number[] }>;

    if (candidatesPayload.length === 0) return [];

    // 5. Call MMR ranker
    const results = await this.aiService.getPersonalizedRecommendations({
      userEmbedding: unitCentroid,
      candidates: candidatesPayload,
      topK: 20,
      diversityLambda: 0.3,
    });

    return results.map((r) => ({
      userId,
      listingId: r.listing_id,
      score: r.final_score,
      reason: 'SEMANTIC_MATCH',
    }));
  }

  async getUserRecommendations(userId: string, pageParam: any = 1, limitParam: any = 20) {
    const page = Number(pageParam) || 1;
    const limit = Number(limitParam) || 20;
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

  async markViewed(id: string) {
    return this.prisma.recommendation.update({ where: { id }, data: { isViewed: true } });
  }

  async dismiss(id: string) {
    return this.prisma.recommendation.update({ where: { id }, data: { isDismissed: true } });
  }
}
