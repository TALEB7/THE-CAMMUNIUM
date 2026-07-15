import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { RedisService } from '../redis/redis.service';
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto } from './dto/update-listing.dto';
import { SearchListingsDto } from './dto/search-listings.dto';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class MarketplaceService {
  private readonly logger = new Logger(MarketplaceService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
    private readonly redis: RedisService,
  ) {}

  // ==================== Listings CRUD ====================

  async createListing(userId: string, dto: CreateListingDto) {
    const user = await this.findUser(userId);

    // Verify the category exists
    const category = await this.prisma.category.findUnique({
      where: { id: dto.categoryId },
    });
    if (!category) throw new BadRequestException('Invalid category');

    // Generate slug
    const slug = this.generateSlug(dto.title);

    const listing = await this.prisma.listing.create({
      data: {
        sellerId: user.id,
        categoryId: dto.categoryId,
        title: dto.title,
        slug,
        description: dto.description,
        price: dto.price,
        condition: dto.condition || 'new',
        city: dto.city,
        location: dto.location,
        images: dto.images || [],
        tags: dto.tags || [],
        status: 'ACTIVE',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
      include: {
        category: true,
        seller: {
          select: { id: true, firstName: true, lastName: true, avatarUrl: true, isVerified: true },
        },
      },
    });

    this.logger.log(`Listing created: ${listing.id} by user ${user.id}`);

    // Fire-and-forget: AI tasks that don't block the response
    this.generateAndStoreListingEmbedding(listing).catch((err) =>
      this.logger.warn(`Failed to generate embedding for listing ${listing.id}: ${err.message}`),
    );

    return listing;
  }

  private async generateAndStoreListingEmbedding(listing: any): Promise<void> {
    const result = await this.aiService.embedListing({
      listingId: listing.id,
      title: listing.title,
      description: listing.description,
      tags: listing.tags ?? [],
      category: listing.category?.name ?? '',
    });

    if (!result || !result.embedding) {
      this.logger.warn(`Skipping embedding storage for listing ${listing.id} due to AI Service failure.`);
      return;
    }

    const embeddingString = `[${result.embedding.join(',')}]`;
    // $executeRawUnsafe is used (with $1, $2... placeholders, no string interpolation
    // of inputs) because Prisma's tagged-template $executeRaw doesn't support the
    // `::vector` cast required for pgvector columns.
    await this.prisma.$executeRawUnsafe(`
      INSERT INTO "listing_embeddings" ("id", "listingId", "embedding", "model", "createdAt", "updatedAt")
      VALUES ($1, $2, $3::vector, $4, NOW(), NOW())
      ON CONFLICT ("listingId") DO UPDATE SET "embedding" = $3::vector, "updatedAt" = NOW()
    `,
      `emb_${listing.id}`,
      listing.id,
      embeddingString,
      result.model ?? "paraphrase-multilingual-MiniLM-L12-v2"
    );

    this.logger.log(`Embedding stored for listing ${listing.id} (${result.dimensions} dims)`);
  }

  async getSimilarListings(listingId: string, topK = 5): Promise<any[]> {
    const CACHE_KEY = `similar_listings:${listingId}`;
    const CACHE_TTL = 300; // 5 minutes

    const cached = await this.redis.get(CACHE_KEY);
    if (cached) return JSON.parse(cached);

    const listing = await this.prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing) return [];

    try {
      // $queryRawUnsafe is used (with $1 placeholder, no string interpolation of inputs)
      // because of the `::vector` / pgvector distance operator below.
      const similar: any[] = await this.prisma.$queryRawUnsafe(`
        SELECT le."listingId" as id, (le.embedding <=> (SELECT embedding FROM listing_embeddings WHERE "listingId" = $1)) as distance
        FROM listing_embeddings le
        INNER JOIN listings l ON l.id = le."listingId"
        WHERE le."listingId" <> $1 AND l.status = 'ACTIVE' AND l."categoryId" = $2
        ORDER BY distance ASC
        LIMIT $3
      `, listingId, listing.categoryId, topK);

      if (similar.length === 0) return [];

      const similarIds = similar.map((s) => s.id);
      const listings = await this.prisma.listing.findMany({
        where: { id: { in: similarIds }, status: 'ACTIVE' },
        include: {
          category: true,
          seller: {
            select: { id: true, firstName: true, lastName: true, avatarUrl: true, isVerified: true },
          },
          _count: { select: { favorites: true } },
        },
      });

      const distanceMap = new Map(similar.map((s) => [s.id, s.distance]));
      const sorted = listings.sort(
        (a, b) => (distanceMap.get(a.id) ?? 0) - (distanceMap.get(b.id) ?? 0),
      );

      await this.redis.set(CACHE_KEY, JSON.stringify(sorted), CACHE_TTL);
      return sorted;
    } catch (err: any) {
      this.logger.warn(`Failed to retrieve similar listings via pgvector: ${err.message}. Falling back to default same-category listings.`);
      
      const fallbackListings = await this.prisma.listing.findMany({
        where: {
          categoryId: listing.categoryId,
          status: 'ACTIVE',
          id: { not: listingId }
        },
        take: topK,
        orderBy: { createdAt: 'desc' },
        include: {
          category: true,
          seller: {
            select: { id: true, firstName: true, lastName: true, avatarUrl: true, isVerified: true },
          },
          _count: { select: { favorites: true } },
        }
      });
      return fallbackListings;
    }
  }

  async updateListing(userId: string, listingId: string, dto: UpdateListingDto) {
    const user = await this.findUser(userId);
    const listing = await this.findListingOwnedBy(listingId, user.id);

    const updateData: any = { ...dto };
    if (dto.title) {
      updateData.slug = this.generateSlug(dto.title);
    }

    return this.prisma.listing.update({
      where: { id: listing.id },
      data: updateData,
      include: {
        category: true,
        seller: {
          select: { id: true, firstName: true, lastName: true, avatarUrl: true, isVerified: true },
        },
      },
    });
  }

  async deleteListing(userId: string, listingId: string) {
    const user = await this.findUser(userId);
    await this.findListingOwnedBy(listingId, user.id);

    await this.prisma.listing.delete({ where: { id: listingId } });
    return { message: 'Listing deleted successfully' };
  }

  async getListingBySlug(slug: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { slug },
      include: {
        category: { include: { parent: true } },
        seller: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            isVerified: true,
            accountType: true,
          },
        },
        reviews: {
          include: {
            reviewer: {
              select: { id: true, firstName: true, lastName: true, avatarUrl: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        auction: true,
        _count: { select: { favorites: true, reviews: true } },
      },
    });

    if (!listing) throw new NotFoundException('Listing not found');

    // Increment view count
    await this.prisma.listing.update({
      where: { id: listing.id },
      data: { viewCount: { increment: 1 } },
    });

    return listing;
  }

  async getListingById(id: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id },
      include: {
        category: true,
        seller: {
          select: { id: true, firstName: true, lastName: true, avatarUrl: true, isVerified: true },
        },
        auction: true,
        _count: { select: { favorites: true, reviews: true } },
      },
    });
    if (!listing) throw new NotFoundException('Listing not found');
    return listing;
  }

  // ==================== Search & Browse ====================

  async searchListings(dto: SearchListingsDto) {
    const page = dto.page || 1;
    const limit = Math.min(dto.limit || 20, 100); // hard cap at 100
    const skip = (page - 1) * limit;

    // Cache popular searches (no free-text queries or specific seller queries) for 5 minutes
    const isCacheable = !dto.q && !dto.sellerId;
    const cacheKey = isCacheable
      ? `search:${dto.category || ''}:${dto.city || ''}:${dto.condition || ''}:${dto.sort || ''}:${dto.minPrice || ''}:${dto.maxPrice || ''}:${page}:${limit}`
      : null;
    if (cacheKey) {
      const cached = await this.redis.get(cacheKey);
      if (cached) return JSON.parse(cached);
    }

    const where: any = {
      status: 'ACTIVE',
    };

    // Seller filter
    if (dto.sellerId) {
      where.sellerId = dto.sellerId;
    }

    // Text search
    if (dto.q) {
      where.OR = [
        { title: { contains: dto.q, mode: 'insensitive' } },
        { description: { contains: dto.q, mode: 'insensitive' } },
        { tags: { has: dto.q.toLowerCase() } },
      ];
    }

    // Category filter (by slug)
    if (dto.category) {
      const category = await this.prisma.category.findUnique({
        where: { slug: dto.category },
        include: { children: true },
      });
      if (category) {
        const categoryIds = [category.id, ...category.children.map((c: any) => c.id)];
        where.categoryId = { in: categoryIds };
      }
    }

    // City filter
    if (dto.city) {
      where.city = { contains: dto.city, mode: 'insensitive' };
    }

    // Condition filter
    if (dto.condition) {
      where.condition = dto.condition;
    }

    // Price range
    if (dto.minPrice !== undefined || dto.maxPrice !== undefined) {
      where.price = {};
      if (dto.minPrice !== undefined) where.price.gte = dto.minPrice;
      if (dto.maxPrice !== undefined) where.price.lte = dto.maxPrice;
    }

    // Sorting
    let orderBy: any = { createdAt: 'desc' };
    switch (dto.sort) {
      case 'oldest':
        orderBy = { createdAt: 'asc' };
        break;
      case 'price_asc':
        orderBy = { price: 'asc' };
        break;
      case 'price_desc':
        orderBy = { price: 'desc' };
        break;
      case 'popular':
        orderBy = { viewCount: 'desc' };
        break;
    }

    const [listings, total] = await Promise.all([
      this.prisma.listing.findMany({
        where,
        include: {
          category: true,
          // Only expose what's needed in browse — no PII beyond verification badge
          seller: { select: { id: true, isVerified: true } },
          _count: { select: { favorites: true } },
        },
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.listing.count({ where }),
    ]);

    const result = {
      data: listings,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };

    if (cacheKey) await this.redis.set(cacheKey, JSON.stringify(result), 300);

    return result;
  }

  async getMyListings(userId: string, status?: string) {
    const user = await this.findUser(userId);

    const where: any = { sellerId: user.id };
    if (status) where.status = status;

    return this.prisma.listing.findMany({
      where,
      include: {
        category: true,
        _count: { select: { favorites: true, reviews: true } },
        auction: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ==================== Favorites ====================

  async toggleFavorite(userId: string, listingId: string) {
    const user = await this.findUser(userId);

    const existing = await this.prisma.favoriteListing.findUnique({
      where: {
        userId_listingId: { userId: user.id, listingId },
      },
    });

    if (existing) {
      await this.prisma.favoriteListing.delete({ where: { id: existing.id } });
      return { favorited: false };
    }

    await this.prisma.favoriteListing.create({
      data: { userId: user.id, listingId },
    });
    return { favorited: true };
  }

  async getMyFavorites(userId: string) {
    const user = await this.findUser(userId);

    const favorites = await this.prisma.favoriteListing.findMany({
      where: { userId: user.id },
      include: {
        listing: {
          include: {
            category: true,
            seller: {
              select: { id: true, firstName: true, lastName: true, avatarUrl: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return favorites.map((f: any) => f.listing);
  }

  // ==================== Reviews ====================

  async createReview(userId: string, listingId: string, dto: CreateReviewDto) {
    const user = await this.findUser(userId);

    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
    });
    if (!listing) throw new NotFoundException('Listing not found');
    if (listing.sellerId === user.id) {
      throw new BadRequestException('You cannot review your own listing');
    }

    return this.prisma.listingReview.upsert({
      where: {
        listingId_reviewerId: { listingId, reviewerId: user.id },
      },
      update: { rating: dto.rating, comment: dto.comment },
      create: {
        listingId,
        reviewerId: user.id,
        rating: dto.rating,
        comment: dto.comment,
      },
      include: {
        reviewer: {
          select: { id: true, firstName: true, lastName: true, avatarUrl: true },
        },
      },
    });
  }

  async getListingReviews(listingId: string) {
    return this.prisma.listingReview.findMany({
      where: { listingId },
      include: {
        reviewer: {
          select: { id: true, firstName: true, lastName: true, avatarUrl: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ==================== Boost Listing ====================

  async boostListing(userId: string, listingId: string) {
    const user = await this.findUser(userId);
    const listing = await this.findListingOwnedBy(listingId, user.id);

    // Check Tks balance (costs 10 Tks)
    const wallet = await this.prisma.tksWallet.findUnique({
      where: { userId: user.id },
    });
    if (!wallet || wallet.balance < 10) {
      throw new BadRequestException('Insufficient Tks balance. Boosting costs 10 Tks.');
    }

    // Deduct Tks and boost the listing
    await this.prisma.$transaction([
      this.prisma.tksWallet.update({
        where: { userId: user.id },
        data: {
          balance: { decrement: 10 },
          totalSpent: { increment: 10 },
        },
      }),
      this.prisma.tksTransaction.create({
        data: {
          userId: user.id,
          amount: -10,
          type: 'SPENT',
          reason: `Boost listing: ${listing.title}`,
          metadata: { listingId: listing.id },
        },
      }),
      this.prisma.listing.update({
        where: { id: listing.id },
        data: {
          isBoosted: true,
          boostedUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
      }),
    ]);

    return { message: 'Listing boosted for 7 days', tksCost: 10 };
  }

  // ==================== AI — Price Suggestion ====================

  /**
   * Returns a suggested price range for a new listing.
   *
   * Pulls up to 50 recent active/sold listing prices in the same category
   * as comparables, then delegates the statistical estimation to the AI
   * service.  The `condition` parameter adjusts the estimate via market
   * multipliers (NEW > LIKE_NEW > GOOD > FAIR > POOR).
   */
  /**
   * Zero-shot NLP classification of a listing's title+description.
   * Returns the best-matching category from the platform's category tree,
   * suggested tags, and an urgency level — all without any labelled data.
   */
  /**
   * Analyze sentiment of all reviews for a listing.
   * Returns per-review sentiment + an aggregate compound score.
   * Results are cached for 10 minutes (reviews don't change frequently).
   */


  async analyzeListingReviewSentiment(listingId: string): Promise<any> {
    const cacheKey = `review_sentiment:${listingId}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const reviews = await this.prisma.listingReview.findMany({
      where: { listingId },
      select: { id: true, comment: true, rating: true },
    });

    const texts = reviews.map((r) => r.comment ?? '').filter(Boolean);
    if (texts.length === 0) return { results: [], avg_compound: 0 };

    const result = await this.aiService.analyzeSentiment(texts);

    // Zip results back with review ids
    const enriched = reviews
      .filter((r) => r.comment)
      .map((r, i) => ({ reviewId: r.id, rating: r.rating, ...result.results[i] }));

    const response = { results: enriched, avg_compound: result.avg_compound };
    await this.redis.set(cacheKey, JSON.stringify(response), 600);
    return response;
  }

  async classifyListing(title: string, description: string): Promise<any> {
    const categories = await this.prisma.category.findMany({
      select: { id: true, name: true },
    });
    const categoryNames = categories.map((c) => c.name);

    const result = await this.aiService.classifyListing({
      title,
      description,
      availableCategories: categoryNames,
    });

    if (!result) {
      return { predicted_category: '', confidence: 0, suggested_tags: [], urgency: 'low', categoryId: null };
    }

    // Resolve the category id from the predicted name
    const matched = categories.find((c) => c.name === result.predicted_category);
    return { ...result, categoryId: matched?.id ?? null };
  }



  async predictListingEta(listingId: string, buyerCity?: string): Promise<any> {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      select: {
        city: true,
        condition: true,
        categoryId: true,
        category: { select: { name: true } },
        sellerId: true,
      },
    });
    if (!listing) throw new NotFoundException('Listing not found');

    const sellerListingCount = await this.prisma.listing.count({
      where: { sellerId: listing.sellerId, status: { in: ['ACTIVE', 'SOLD'] } },
    });

    return this.aiService.predictEta({
      categoryName:        listing.category?.name,
      sellerCity:          listing.city ?? undefined,
      buyerCity,
      condition:           listing.condition,
      sellerListingCount,
    });
  }

  async suggestPrice(categoryId: string, condition: string): Promise<any> {
    const recent = await this.prisma.listing.findMany({
      where: { categoryId, status: 'ACTIVE' },
      select: { price: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const comparablePrices = recent.map((l) => l.price);
    return this.aiService.suggestPrice({ condition, comparablePrices });
  }

  // ==================== Helpers ====================

  private async findUser(userId: string) {
    
    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  private async findListingOwnedBy(listingId: string, userId: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
    });
    if (!listing) throw new NotFoundException('Listing not found');
    if (listing.sellerId !== userId) {
      throw new ForbiddenException('You do not own this listing');
    }
    return listing;
  }

  private generateSlug(title: string): string {
    const base = title
      .toLowerCase()
      .replace(/[àáâãäå]/g, 'a')
      .replace(/[èéêë]/g, 'e')
      .replace(/[ìíîï]/g, 'i')
      .replace(/[òóôõö]/g, 'o')
      .replace(/[ùúûü]/g, 'u')
      .replace(/[ç]/g, 'c')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    const suffix = Date.now().toString(36);
    return `${base}-${suffix}`;
  }
}
