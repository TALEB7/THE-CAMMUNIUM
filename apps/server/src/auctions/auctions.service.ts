import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAuctionDto } from './dto/create-auction.dto';
import { PlaceBidDto } from './dto/place-bid.dto';

@Injectable()
export class AuctionsService {
  private readonly logger = new Logger(AuctionsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ==================== Create Auction ====================

  async createAuction(clerkId: string, dto: CreateAuctionDto) {
    const user = await this.findUserByClerkId(clerkId);

    // Verify listing ownership
    const listing = await this.prisma.listing.findUnique({
      where: { id: dto.listingId },
    });
    if (!listing) throw new NotFoundException('Listing not found');
    if (listing.sellerId !== user.id) {
      throw new ForbiddenException('You do not own this listing');
    }

    // Check that listing doesn't already have an auction
    const existingAuction = await this.prisma.auction.findUnique({
      where: { listingId: dto.listingId },
    });
    if (existingAuction) {
      throw new BadRequestException('This listing already has an auction');
    }

    // Validate times
    const startTime = new Date(dto.startTime);
    const endTime = new Date(dto.endTime);
    if (startTime >= endTime) {
      throw new BadRequestException('End time must be after start time');
    }
    if (endTime.getTime() - startTime.getTime() < 60 * 60 * 1000) {
      throw new BadRequestException('Auction must last at least 1 hour');
    }

    const status = startTime <= new Date() ? 'ACTIVE' : 'SCHEDULED';

    const auction = await this.prisma.auction.create({
      data: {
        listingId: dto.listingId,
        sellerId: user.id,
        startingPrice: dto.startingPrice,
        reservePrice: dto.reservePrice,
        currentPrice: dto.startingPrice,
        minIncrement: dto.minIncrement || 10,
        status,
        startTime,
        endTime,
      },
      include: {
        listing: {
          include: { category: true },
        },
      },
    });

    // Update listing status
    await this.prisma.listing.update({
      where: { id: dto.listingId },
      data: { status: 'ACTIVE' },
    });

    this.logger.log(`Auction created: ${auction.id} for listing ${dto.listingId}`);
    return auction;
  }

  // ==================== Place Bid ====================

  async placeBid(clerkId: string, auctionId: string, dto: PlaceBidDto) {
    const user = await this.findUserByClerkId(clerkId);

    const auction = await this.prisma.auction.findUnique({
      where: { id: auctionId },
      include: { listing: true },
    });
    if (!auction) throw new NotFoundException('Auction not found');

    // Validations
    if (auction.sellerId === user.id) {
      throw new BadRequestException('You cannot bid on your own auction');
    }
    if (auction.status !== 'ACTIVE') {
      throw new BadRequestException('This auction is not currently active');
    }
    if (new Date() > auction.endTime) {
      throw new BadRequestException('This auction has ended');
    }
    if (dto.amount <= auction.currentPrice) {
      throw new BadRequestException(
        `Bid must be higher than current price of ${auction.currentPrice} MAD`,
      );
    }
    if (dto.amount - auction.currentPrice < auction.minIncrement) {
      throw new BadRequestException(
        `Minimum bid increment is ${auction.minIncrement} MAD`,
      );
    }

    // Place the bid in a transaction
    const [bid] = await this.prisma.$transaction([
      this.prisma.bid.create({
        data: {
          auctionId,
          bidderId: user.id,
          amount: dto.amount,
          isWinning: true,
        },
        include: {
          bidder: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      }),
      // Mark previous winning bid as not winning
      this.prisma.bid.updateMany({
        where: {
          auctionId,
          isWinning: true,
          bidderId: { not: user.id },
        },
        data: { isWinning: false },
      }),
      // Update also the current bid from the same user if they previously had a winning bid
      this.prisma.bid.updateMany({
        where: {
          auctionId,
          bidderId: user.id,
          isWinning: true,
          amount: { not: dto.amount },
        },
        data: { isWinning: false },
      }),
      // Update auction current price
      this.prisma.auction.update({
        where: { id: auctionId },
        data: {
          currentPrice: dto.amount,
          totalBids: { increment: 1 },
        },
      }),
    ]);

    this.logger.log(`Bid placed: ${dto.amount} MAD on auction ${auctionId} by user ${user.id}`);
    return bid;
  }

  // ==================== Get Auction ====================

  async getAuction(auctionId: string) {
    const auction = await this.prisma.auction.findUnique({
      where: { id: auctionId },
      include: {
        listing: {
          include: {
            category: true,
            seller: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
                isVerified: true,
              },
            },
          },
        },
        bids: {
          include: {
            bidder: {
              select: { id: true, firstName: true, lastName: true, avatarUrl: true },
            },
          },
          orderBy: { amount: 'desc' },
          take: 20,
        },
      },
    });
    if (!auction) throw new NotFoundException('Auction not found');
    return auction;
  }

  // ==================== Browse Auctions ====================

  async getActiveAuctions(page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    // Auto-activate scheduled auctions whose start time has passed
    await this.prisma.auction.updateMany({
      where: {
        status: 'SCHEDULED',
        startTime: { lte: new Date() },
      },
      data: { status: 'ACTIVE' },
    });

    // Auto-end expired auctions
    await this.prisma.auction.updateMany({
      where: {
        status: 'ACTIVE',
        endTime: { lte: new Date() },
      },
      data: { status: 'ENDED' },
    });

    const where = { status: 'ACTIVE' };

    const [auctions, total] = await Promise.all([
      this.prisma.auction.findMany({
        where,
        include: {
          listing: {
            include: {
              category: true,
              seller: {
                select: { id: true, firstName: true, lastName: true, avatarUrl: true, isVerified: true },
              },
            },
          },
          _count: { select: { bids: true } },
        },
        orderBy: { endTime: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.auction.count({ where }),
    ]);

    return {
      data: auctions,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getEndedAuctions(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where = { status: 'ENDED' };

    const [auctions, total] = await Promise.all([
      this.prisma.auction.findMany({
        where,
        include: {
          listing: {
            include: {
              category: true,
              seller: {
                select: { id: true, firstName: true, lastName: true, avatarUrl: true },
              },
            },
          },
          bids: {
            where: { isWinning: true },
            include: {
              bidder: {
                select: { id: true, firstName: true, lastName: true },
              },
            },
          },
          _count: { select: { bids: true } },
        },
        orderBy: { endTime: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.auction.count({ where }),
    ]);

    return {
      data: auctions,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getMyAuctions(clerkId: string) {
    const user = await this.findUserByClerkId(clerkId);

    return this.prisma.auction.findMany({
      where: { sellerId: user.id },
      include: {
        listing: { include: { category: true } },
        _count: { select: { bids: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getMyBids(clerkId: string) {
    const user = await this.findUserByClerkId(clerkId);

    return this.prisma.bid.findMany({
      where: { bidderId: user.id },
      include: {
        auction: {
          include: {
            listing: {
              include: { category: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ==================== Cancel Auction ====================

  async cancelAuction(clerkId: string, auctionId: string) {
    const user = await this.findUserByClerkId(clerkId);

    const auction = await this.prisma.auction.findUnique({
      where: { id: auctionId },
    });
    if (!auction) throw new NotFoundException('Auction not found');
    if (auction.sellerId !== user.id) {
      throw new ForbiddenException('You do not own this auction');
    }
    if (auction.status === 'ENDED') {
      throw new BadRequestException('Cannot cancel an ended auction');
    }
    if (auction.totalBids > 0) {
      throw new BadRequestException('Cannot cancel auction with existing bids');
    }

    await this.prisma.auction.update({
      where: { id: auctionId },
      data: { status: 'CANCELED' },
    });

    return { message: 'Auction canceled successfully' };
  }

  // ==================== Helpers ====================

  private async findUserByClerkId(clerkId: string) {
    const user = await this.prisma.user.findUnique({
      where: { clerkId },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }
}
