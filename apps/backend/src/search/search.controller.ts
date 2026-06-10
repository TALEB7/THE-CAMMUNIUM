import { Controller, Get, Post, Delete, Patch, Query, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SearchService } from './search.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('search')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  // ── Public search ────────────────────────────────────────────────────────────

  @Get()
  globalSearch(
    @Query('q') query: string,
    @Query('type') type?: 'listings' | 'users' | 'mentors' | 'all',
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.searchService.globalSearch(query || '', { type, page, limit });
  }

  @Get('listings')
  searchListings(
    @Query('q') query?: string,
    @Query('categoryId') categoryId?: string,
    @Query('minPrice') minPrice?: number,
    @Query('maxPrice') maxPrice?: number,
    @Query('city') city?: string,
    @Query('condition') condition?: string,
    @Query('sortBy') sortBy?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.searchService.searchListings({
      query, categoryId, minPrice, maxPrice, city, condition, sortBy, page, limit,
    });
  }

  // -- Saved Searches --
  @Post('saved')
  @UseGuards(JwtAuthGuard)
  createSavedSearch(@CurrentUser('id') userId: string, @Body() data: Record<string, any>) {
    return this.searchService.createSavedSearch(userId, data);
  }

  @Get('saved/:userId')
  @UseGuards(JwtAuthGuard)
  getUserSavedSearches(@CurrentUser('id') userId: string) {
    return this.searchService.getUserSavedSearches(userId);
  }

  @Delete('saved/:id')
  @UseGuards(JwtAuthGuard)
  deleteSavedSearch(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.searchService.deleteSavedSearch(id, userId);
  }

  @Patch('saved/:id/toggle-alert')
  @UseGuards(JwtAuthGuard)
  toggleSearchAlert(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.searchService.toggleSearchAlert(id, userId);
  }

  // -- Price Alerts --
  @Post('alerts')
  @UseGuards(JwtAuthGuard)
  createPriceAlert(@CurrentUser('id') userId: string, @Body() body: { listingId: string; targetPrice: number }) {
    return this.searchService.createPriceAlert(userId, body.listingId, body.targetPrice);
  }

  @Get('alerts/:userId')
  @UseGuards(JwtAuthGuard)
  getUserPriceAlerts(@CurrentUser('id') userId: string) {
    return this.searchService.getUserPriceAlerts(userId);
  }

  @Delete('alerts/:id')
  @UseGuards(JwtAuthGuard)
  deletePriceAlert(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.searchService.deletePriceAlert(id, userId);
  }
}
