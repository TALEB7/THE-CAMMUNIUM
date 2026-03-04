import { Controller, Get, Post, Delete, Patch, Query, Param, Body } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SearchService } from './search.service';

@ApiTags('search')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

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
  createSavedSearch(@Body() body: { userId: string } & Record<string, any>) {
    const { userId, ...data } = body;
    return this.searchService.createSavedSearch(userId, data);
  }

  @Get('saved/:userId')
  getUserSavedSearches(@Param('userId') userId: string) {
    return this.searchService.getUserSavedSearches(userId);
  }

  @Delete('saved/:id')
  deleteSavedSearch(@Param('id') id: string, @Body('userId') userId: string) {
    return this.searchService.deleteSavedSearch(id, userId);
  }

  @Patch('saved/:id/toggle-alert')
  toggleSearchAlert(@Param('id') id: string, @Body('userId') userId: string) {
    return this.searchService.toggleSearchAlert(id, userId);
  }

  // -- Price Alerts --
  @Post('alerts')
  createPriceAlert(@Body() body: { userId: string; listingId: string; targetPrice: number }) {
    return this.searchService.createPriceAlert(body.userId, body.listingId, body.targetPrice);
  }

  @Get('alerts/:userId')
  getUserPriceAlerts(@Param('userId') userId: string) {
    return this.searchService.getUserPriceAlerts(userId);
  }

  @Delete('alerts/:id')
  deletePriceAlert(@Param('id') id: string, @Body('userId') userId: string) {
    return this.searchService.deletePriceAlert(id, userId);
  }
}
