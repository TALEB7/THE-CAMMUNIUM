import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MarketplaceService } from './marketplace.service';
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto } from './dto/update-listing.dto';
import { SearchListingsDto } from './dto/search-listings.dto';
import { CreateReviewDto } from './dto/create-review.dto';
import { ClerkAuthGuard } from '../common/guards/clerk-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('marketplace')
@Controller('marketplace')
export class MarketplaceController {
  constructor(private readonly marketplaceService: MarketplaceService) {}

  // ==================== Public Endpoints ====================

  @Get('listings')
  @ApiOperation({ summary: 'Search & browse marketplace listings' })
  searchListings(@Query() dto: SearchListingsDto) {
    return this.marketplaceService.searchListings(dto);
  }

  @Get('listings/slug/:slug')
  @ApiOperation({ summary: 'Get a listing by slug' })
  getListingBySlug(@Param('slug') slug: string) {
    return this.marketplaceService.getListingBySlug(slug);
  }

  @Get('listings/:id')
  @ApiOperation({ summary: 'Get a listing by ID' })
  getListingById(@Param('id') id: string) {
    return this.marketplaceService.getListingById(id);
  }

  @Get('listings/:id/reviews')
  @ApiOperation({ summary: 'Get reviews for a listing' })
  getListingReviews(@Param('id') id: string) {
    return this.marketplaceService.getListingReviews(id);
  }

  // ==================== Authenticated Endpoints ====================

  @Post('listings')
  @UseGuards(ClerkAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new listing' })
  createListing(@CurrentUser('clerkId') clerkId: string, @Body() dto: CreateListingDto) {
    return this.marketplaceService.createListing(clerkId, dto);
  }

  @Put('listings/:id')
  @UseGuards(ClerkAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a listing' })
  updateListing(
    @CurrentUser('clerkId') clerkId: string,
    @Param('id') id: string,
    @Body() dto: UpdateListingDto,
  ) {
    return this.marketplaceService.updateListing(clerkId, id, dto);
  }

  @Delete('listings/:id')
  @UseGuards(ClerkAuthGuard)
  @ApiBearerAuth()
  @HttpCode(200)
  @ApiOperation({ summary: 'Delete a listing' })
  deleteListing(@CurrentUser('clerkId') clerkId: string, @Param('id') id: string) {
    return this.marketplaceService.deleteListing(clerkId, id);
  }

  @Get('my-listings')
  @UseGuards(ClerkAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user listings' })
  getMyListings(@CurrentUser('clerkId') clerkId: string, @Query('status') status?: string) {
    return this.marketplaceService.getMyListings(clerkId, status);
  }

  @Post('listings/:id/favorite')
  @UseGuards(ClerkAuthGuard)
  @ApiBearerAuth()
  @HttpCode(200)
  @ApiOperation({ summary: 'Toggle favorite on a listing' })
  toggleFavorite(@CurrentUser('clerkId') clerkId: string, @Param('id') id: string) {
    return this.marketplaceService.toggleFavorite(clerkId, id);
  }

  @Get('favorites')
  @UseGuards(ClerkAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user favorite listings' })
  getMyFavorites(@CurrentUser('clerkId') clerkId: string) {
    return this.marketplaceService.getMyFavorites(clerkId);
  }

  @Post('listings/:id/reviews')
  @UseGuards(ClerkAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Review a listing' })
  createReview(
    @CurrentUser('clerkId') clerkId: string,
    @Param('id') id: string,
    @Body() dto: CreateReviewDto,
  ) {
    return this.marketplaceService.createReview(clerkId, id, dto);
  }

  @Post('listings/:id/boost')
  @UseGuards(ClerkAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Boost a listing with Tks tokens (10 Tks for 7 days)' })
  boostListing(@CurrentUser('clerkId') clerkId: string, @Param('id') id: string) {
    return this.marketplaceService.boostListing(clerkId, id);
  }
}
