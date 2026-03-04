import { Controller, Get, Post, Patch, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { RecommendationsService } from './recommendations.service';

@ApiTags('recommendations')
@Controller('recommendations')
export class RecommendationsController {
  constructor(private readonly service: RecommendationsService) {}

  @Post('generate/:userId')
  generate(@Param('userId') userId: string) {
    return this.service.generateRecommendations(userId);
  }

  @Get(':userId')
  getUserRecommendations(
    @Param('userId') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.service.getUserRecommendations(userId, page, limit);
  }

  @Patch(':id/viewed')
  markViewed(@Param('id') id: string) {
    return this.service.markViewed(id);
  }

  @Patch(':id/dismiss')
  dismiss(@Param('id') id: string) {
    return this.service.dismiss(id);
  }
}
