import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto } from './dto/update-listing.dto';
import { SearchListingsDto } from './dto/search-listings.dto';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class MarketplaceService {
  private readonly logger = new Logger(MarketplaceService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ==================== Listings CRUD ====================

  async createListing(clerkId: string, dto: CreateListingDto) {
    const user = await this.findUserByClerkId(clerkId);

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
    return listing;
  }

  async updateListing(clerkId: string, listingId: string, dto: UpdateListingDto) {
    const user = await this.findUserByClerkId(clerkId);
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

  async deleteListing(clerkId: string, listingId: string) {
    const user = await this.findUserByClerkId(clerkId);
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
    const limit = dto.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      status: 'ACTIVE',
    };

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
        const categoryIds = [category.id, ...category.children.map((c) => c.id)];
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
          seller: {
            select: { id: true, firstName: true, lastName: true, avatarUrl: true, isVerified: true },
          },
          _count: { select: { favorites: true } },
        },
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.listing.count({ where }),
    ]);

    return {
      data: listings,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getMyListings(clerkId: string, status?: string) {
    const user = await this.findUserByClerkId(clerkId);

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

  async toggleFavorite(clerkId: string, listingId: string) {
    const user = await this.findUserByClerkId(clerkId);

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

  async getMyFavorites(clerkId: string) {
    const user = await this.findUserByClerkId(clerkId);

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

    return favorites.map((f) => f.listing);
  }

  // ==================== Reviews ====================

  async createReview(clerkId: string, listingId: string, dto: CreateReviewDto) {
    const user = await this.findUserByClerkId(clerkId);

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

  async boostListing(clerkId: string, listingId: string) {
    const user = await this.findUserByClerkId(clerkId);
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

  // ==================== Helpers ====================

  private async findUserByClerkId(clerkId: string) {
    const user = await this.prisma.user.findUnique({
      where: { clerkId },
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
