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
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
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

  @Get('listings/classify')
  @ApiOperation({ summary: 'NLP auto-classify a listing title+description → category + tags' })
  classifyListing(@Query('title') title: string, @Query('description') description: string) {
    return this.marketplaceService.classifyListing(title ?? '', description ?? '');
  }

  @Get('listings/price-suggestion')
  @ApiOperation({ summary: 'Get AI-suggested price range for a listing (before creation)' })
  suggestPrice(
    @Query('categoryId') categoryId: string,
    @Query('condition') condition: string,
  ) {
    return this.marketplaceService.suggestPrice(categoryId, condition ?? 'GOOD');
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

  @Get('listings/:id/price-check')
  @ApiOperation({ summary: 'Check if a listing price is a statistical anomaly for its category' })
  checkPriceAnomaly(@Param('id') id: string) {
    return this.marketplaceService.checkPriceAnomaly(id);
  }

  @Get('listings/:id/fraud-check')
  @ApiOperation({ summary: 'AI fraud/fake-review detection for a listing (admin use)' })
  detectReviewFraud(@Param('id') id: string) {
    return this.marketplaceService.detectReviewFraud(id);
  }

  @Get('listings/:id/sentiment')
  @ApiOperation({ summary: 'Sentiment analysis of all reviews for a listing' })
  getReviewSentiment(@Param('id') id: string) {
    return this.marketplaceService.analyzeListingReviewSentiment(id);
  }

  @Get('listings/:id/similar')
  @ApiOperation({ summary: 'Get AI-powered similar listings' })
  getSimilarListings(@Param('id') id: string, @Query('limit') limit?: number) {
    return this.marketplaceService.getSimilarListings(id, limit ?? 5);
  }

  @Get('listings/:id/eta')
  @ApiOperation({ summary: 'Predict delivery ETA for a listing (minutes, hours, days)' })
  predictListingEta(@Param('id') id: string, @Query('buyerCity') buyerCity?: string) {
    return this.marketplaceService.predictListingEta(id, buyerCity);
  }

  // ==================== Authenticated Endpoints ====================

  @Post('listings')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new listing' })
  createListing(@CurrentUser('id') userId: string, @Body() dto: CreateListingDto) {
    return this.marketplaceService.createListing(userId, dto);
  }

  @Put('listings/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a listing' })
  updateListing(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateListingDto,
  ) {
    return this.marketplaceService.updateListing(userId, id, dto);
  }

  @Delete('listings/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(200)
  @ApiOperation({ summary: 'Delete a listing' })
  deleteListing(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.marketplaceService.deleteListing(userId, id);
  }

  @Get('my-listings')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user listings' })
  getMyListings(@CurrentUser('id') userId: string, @Query('status') status?: string) {
    return this.marketplaceService.getMyListings(userId, status);
  }

  @Post('listings/:id/favorite')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(200)
  @ApiOperation({ summary: 'Toggle favorite on a listing' })
  toggleFavorite(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.marketplaceService.toggleFavorite(userId, id);
  }

  @Get('favorites')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user favorite listings' })
  getMyFavorites(@CurrentUser('id') userId: string) {
    return this.marketplaceService.getMyFavorites(userId);
  }

  @Post('listings/:id/reviews')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Review a listing' })
  createReview(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: CreateReviewDto,
  ) {
    return this.marketplaceService.createReview(userId, id, dto);
  }

  @Post('listings/:id/boost')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Boost a listing with Tks tokens (10 Tks for 7 days)' })
  boostListing(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.marketplaceService.boostListing(userId, id);
  }
}
