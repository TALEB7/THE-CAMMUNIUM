import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuctionsService } from './auctions.service';
import { CreateAuctionDto } from './dto/create-auction.dto';
import { PlaceBidDto } from './dto/place-bid.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('auctions')
@Controller('auctions')
export class AuctionsController {
  constructor(private readonly auctionsService: AuctionsService) {}

  // ==================== Public Endpoints ====================

  @Get()
  @ApiOperation({ summary: 'Get active auctions' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getActiveAuctions(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.auctionsService.getActiveAuctions(page || 1, limit || 20);
  }

  @Get('ended')
  @ApiOperation({ summary: 'Get ended auctions' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getEndedAuctions(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.auctionsService.getEndedAuctions(page || 1, limit || 20);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get auction details with bids' })
  getAuction(@Param('id') id: string, @Req() req: any) {
    return this.auctionsService.getAuction(id, req.user?.id);
  }

  // ==================== Authenticated Endpoints ====================

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new auction for a listing' })
  createAuction(@CurrentUser('id') userId: string, @Body() dto: CreateAuctionDto) {
    return this.auctionsService.createAuction(userId, dto);
  }

  @Post(':id/bid')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(200)
  @ApiOperation({ summary: 'Place a bid on an auction' })
  placeBid(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: PlaceBidDto,
  ) {
    return this.auctionsService.placeBid(userId, id, dto);
  }

  @Get('my/auctions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my auctions (as seller)' })
  getMyAuctions(@CurrentUser('id') userId: string) {
    return this.auctionsService.getMyAuctions(userId);
  }

  @Get('my/bids')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my bids (as bidder)' })
  getMyBids(@CurrentUser('id') userId: string) {
    return this.auctionsService.getMyBids(userId);
  }

  @Post(':id/cancel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(200)
  @ApiOperation({ summary: 'Cancel an auction (only if no bids)' })
  cancelAuction(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.auctionsService.cancelAuction(userId, id);
  }
}
