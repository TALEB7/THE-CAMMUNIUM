import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  // -- Global Search --
  async globalSearch(query: string, filters: {
    type?: 'listings' | 'users' | 'mentors' | 'all';
    page?: number;
    limit?: number;
  }) {
    const { type = 'all', page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;
    const results: any = {};

    if (type === 'all' || type === 'listings') {
      const [listings, listingsTotal] = await Promise.all([
        this.prisma.listing.findMany({
          where: {
            status: 'ACTIVE',
            OR: [
              { title: { contains: query, mode: 'insensitive' } },
              { description: { contains: query, mode: 'insensitive' } },
              { tags: { hasSome: [query] } },
              { city: { contains: query, mode: 'insensitive' } },
            ],
          },
          include: {
            seller: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
            category: { select: { id: true, name: true, slug: true } },
          },
          orderBy: [{ isBoosted: 'desc' }, { createdAt: 'desc' }],
          skip: type === 'listings' ? skip : 0,
          take: type === 'listings' ? limit : 5,
        }),
        this.prisma.listing.count({
          where: {
            status: 'ACTIVE',
            OR: [
              { title: { contains: query, mode: 'insensitive' } },
              { description: { contains: query, mode: 'insensitive' } },
              { tags: { hasSome: [query] } },
              { city: { contains: query, mode: 'insensitive' } },
            ],
          },
        }),
      ]);
      results.listings = { items: listings, total: listingsTotal };
    }

    if (type === 'all' || type === 'users') {
      const [users, usersTotal] = await Promise.all([
        this.prisma.user.findMany({
          where: {
            status: 'ACTIVE',
            OR: [
              { firstName: { contains: query, mode: 'insensitive' } },
              { lastName: { contains: query, mode: 'insensitive' } },
              { email: { contains: query, mode: 'insensitive' } },
            ],
          },
          select: {
            id: true, firstName: true, lastName: true, avatarUrl: true,
            accountType: true, isVerified: true, createdAt: true,
            _count: { select: { listings: true } },
          },
          skip: type === 'users' ? skip : 0,
          take: type === 'users' ? limit : 5,
        }),
        this.prisma.user.count({
          where: {
            status: 'ACTIVE',
            OR: [
              { firstName: { contains: query, mode: 'insensitive' } },
              { lastName: { contains: query, mode: 'insensitive' } },
              { email: { contains: query, mode: 'insensitive' } },
            ],
          },
        }),
      ]);
      results.users = { items: users, total: usersTotal };
    }

    if (type === 'all' || type === 'mentors') {
      const [mentors, mentorsTotal] = await Promise.all([
        this.prisma.mentorProfile.findMany({
          where: {
            isAvailable: true,
            OR: [
              { headline: { contains: query, mode: 'insensitive' } },
              { bio: { contains: query, mode: 'insensitive' } },
              { expertise: { hasSome: [query] } },
              { industries: { hasSome: [query] } },
            ],
          },
          include: {
            user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
          },
          orderBy: { rating: 'desc' },
          skip: type === 'mentors' ? skip : 0,
          take: type === 'mentors' ? limit : 5,
        }),
        this.prisma.mentorProfile.count({
          where: {
            isAvailable: true,
            OR: [
              { headline: { contains: query, mode: 'insensitive' } },
              { bio: { contains: query, mode: 'insensitive' } },
              { expertise: { hasSome: [query] } },
              { industries: { hasSome: [query] } },
            ],
          },
        }),
      ]);
      results.mentors = { items: mentors, total: mentorsTotal };
    }

    return results;
  }

  // -- Advanced Listing Search --
  async searchListings(filters: {
    query?: string;
    categoryId?: string;
    minPrice?: number;
    maxPrice?: number;
    city?: string;
    condition?: string;
    sortBy?: string;
    page?: number;
    limit?: number;
  }) {
    const { page = 1, limit = 20, sortBy = 'createdAt' } = filters;
    const where: any = { status: 'ACTIVE' };

    if (filters.query) {
      where.OR = [
        { title: { contains: filters.query, mode: 'insensitive' } },
        { description: { contains: filters.query, mode: 'insensitive' } },
        { tags: { hasSome: [filters.query] } },
      ];
    }
    if (filters.categoryId) where.categoryId = filters.categoryId;
    if (filters.minPrice || filters.maxPrice) {
      where.price = {};
      if (filters.minPrice) where.price.gte = filters.minPrice;
      if (filters.maxPrice) where.price.lte = filters.maxPrice;
    }
    if (filters.city) where.city = { contains: filters.city, mode: 'insensitive' };
    if (filters.condition) where.condition = filters.condition;

    const orderBy: any = {};
    switch (sortBy) {
      case 'price_asc': orderBy.price = 'asc'; break;
      case 'price_desc': orderBy.price = 'desc'; break;
      case 'popular': orderBy.viewCount = 'desc'; break;
      default: orderBy.createdAt = 'desc';
    }

    const [listings, total] = await Promise.all([
      this.prisma.listing.findMany({
        where,
        include: {
          seller: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
          category: { select: { id: true, name: true, slug: true } },
          _count: { select: { favorites: true, reviews: true } },
        },
        orderBy: [{ isBoosted: 'desc' }, orderBy],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.listing.count({ where }),
    ]);

    return { listings, total, page, totalPages: Math.ceil(total / limit) };
  }

  // -- Saved Searches --
  async createSavedSearch(userId: string, data: any) {
    return this.prisma.savedSearch.create({
      data: { userId, ...data },
    });
  }

  async getUserSavedSearches(userId: string) {
    return this.prisma.savedSearch.findMany({
      where: { userId },
      include: { category: { select: { name: true, slug: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deleteSavedSearch(id: string, userId: string) {
    return this.prisma.savedSearch.deleteMany({ where: { id, userId } });
  }

  async toggleSearchAlert(id: string, userId: string) {
    const search = await this.prisma.savedSearch.findFirst({ where: { id, userId } });
    if (!search) return null;
    return this.prisma.savedSearch.update({
      where: { id },
      data: { alertEnabled: !search.alertEnabled },
    });
  }

  // -- Price Alerts --
  async createPriceAlert(userId: string, listingId: string, targetPrice: number) {
    return this.prisma.priceAlert.upsert({
      where: { userId_listingId: { userId, listingId } },
      create: { userId, listingId, targetPrice },
      update: { targetPrice, isTriggered: false, isActive: true },
    });
  }

  async getUserPriceAlerts(userId: string) {
    return this.prisma.priceAlert.findMany({
      where: { userId, isActive: true },
      include: {
        listing: {
          select: { id: true, title: true, price: true, images: true, slug: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deletePriceAlert(id: string, userId: string) {
    return this.prisma.priceAlert.deleteMany({ where: { id, userId } });
  }
}
