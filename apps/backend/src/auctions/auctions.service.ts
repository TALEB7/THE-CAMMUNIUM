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

  async createAuction(userId: string, dto: CreateAuctionDto) {
    const user = await this.findUser(userId);

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

  async placeBid(userId: string, auctionId: string, dto: PlaceBidDto) {
    const user = await this.findUser(userId);

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
    let bid: any;
    try {
      [bid] = await this.prisma.$transaction([
        this.prisma.bid.create({
          data: { auctionId, bidderId: user.id, amount: dto.amount, isWinning: true },
          include: { bidder: { select: { id: true } } },
        }),
        this.prisma.bid.updateMany({
          where: { auctionId, isWinning: true, bidderId: { not: user.id } },
          data: { isWinning: false },
        }),
        this.prisma.bid.updateMany({
          where: { auctionId, bidderId: user.id, isWinning: true, amount: { not: dto.amount } },
          data: { isWinning: false },
        }),
        this.prisma.auction.update({
          where: { id: auctionId },
          data: { currentPrice: dto.amount, totalBids: { increment: 1 } },
        }),
      ]);
    } catch (err) {
      this.logger.error(`Bid transaction failed for auction ${auctionId}`, err);
      throw new BadRequestException('La mise n\'a pas pu être enregistrée. Veuillez réessayer.');
    }

    this.logger.log(`Bid placed: ${dto.amount} MAD on auction ${auctionId} by user ${user.id}`);
    return bid;
  }

  // ==================== Get Auction ====================

  async getAuction(auctionId: string, requestingUserId?: string) {
    const auction = await this.prisma.auction.findUnique({
      where: { id: auctionId },
      include: {
        listing: {
          include: {
            category: true,
            seller: {
              select: { id: true, firstName: true, lastName: true, avatarUrl: true, isVerified: true },
            },
          },
        },
        bids: {
          include: {
            bidder: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
          },
          orderBy: { amount: 'desc' },
          take: 20,
        },
      },
    });
    if (!auction) throw new NotFoundException('Auction not found');

    // Anonymize bidder identities — only the seller or the bidder themselves can see real names.
    // Once the auction has ended, all names are revealed.
    const isEnded   = auction.status === 'ENDED' || auction.status === 'CANCELLED';
    const sellerId  = (auction.listing as any)?.seller?.id;
    const isSeller  = requestingUserId && requestingUserId === sellerId;

    if (!isEnded && !isSeller) {
      (auction as any).bids = auction.bids.map((bid: any) => {
        const isSelf = requestingUserId && bid.bidder?.id === requestingUserId;
        return {
          ...bid,
          bidder: isSelf
            ? bid.bidder
            : { id: bid.bidder?.id, firstName: 'Enchérisseur', lastName: 'Anonyme', avatarUrl: null },
        };
      });
    }

    return auction;
  }

  // ==================== Browse Auctions ====================

  async getActiveAuctions(pageParam: any = 1, limitParam: any = 20) {
    const page = Number(pageParam) || 1;
    const limit = Number(limitParam) || 20;
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

  async getEndedAuctions(pageParam: any = 1, limitParam: any = 20) {
    const page = Number(pageParam) || 1;
    const limit = Number(limitParam) || 20;
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

  async getMyAuctions(userId: string) {
    const user = await this.findUser(userId);

    return this.prisma.auction.findMany({
      where: { sellerId: user.id },
      include: {
        listing: { include: { category: true } },
        _count: { select: { bids: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getMyBids(userId: string) {
    const user = await this.findUser(userId);

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

  async cancelAuction(userId: string, auctionId: string) {
    const user = await this.findUser(userId);

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

  private async findUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }
}
