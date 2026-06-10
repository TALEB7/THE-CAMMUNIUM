import { Controller, Get, Post, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { BadgesService } from './badges.service';

@ApiTags('badges')
@Controller('badges')
export class BadgesController {
  constructor(private readonly badgesService: BadgesService) {}

  // ── Admin: CRUD ──

  @Post()
  @ApiOperation({ summary: 'Create badge (admin)' })
  create(@Body() body: any) {
    return this.badgesService.createBadge(body);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update badge (admin)' })
  update(@Param('id') id: string, @Body() body: any) {
    return this.badgesService.updateBadge(id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete badge (admin)' })
  remove(@Param('id') id: string) {
    return this.badgesService.deleteBadge(id);
  }

  // ── Browse ──

  @Get()
  @ApiOperation({ summary: 'Get all badges' })
  findAll(@Query('includeSecret') includeSecret?: string) {
    return this.badgesService.getAllBadges(includeSecret === 'true');
  }

  @Get('leaderboard')
  @ApiOperation({ summary: 'Get leaderboard' })
  leaderboard(@Query('limit') limit?: string) {
    return this.badgesService.getLeaderboard(limit ? parseInt(limit) : 20);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get badge by ID' })
  findOne(@Param('id') id: string) {
    return this.badgesService.getBadgeById(id);
  }

  // ── User badges ──

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get user badges' })
  getUserBadges(@Param('userId') userId: string) {
    return this.badgesService.getUserBadges(userId);
  }

  @Post('award')
  @ApiOperation({ summary: 'Award badge to user' })
  award(@Body() body: { userId: string; badgeId: string; awardedBy?: string }) {
    return this.badgesService.awardBadge(body.userId, body.badgeId, body.awardedBy);
  }

  @Delete('revoke/:userId/:badgeId')
  @ApiOperation({ summary: 'Revoke badge from user' })
  revoke(@Param('userId') userId: string, @Param('badgeId') badgeId: string) {
    return this.badgesService.revokeBadge(userId, badgeId);
  }

  @Post('check/:userId')
  @ApiOperation({ summary: 'Check and auto-award badges' })
  checkBadges(@Param('userId') userId: string) {
    return this.badgesService.checkAndAwardBadges(userId);
  }
}
