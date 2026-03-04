import { Controller, Get, Post, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { BookmarksService } from './bookmarks.service';

@ApiTags('bookmarks')
@Controller('bookmarks')
export class BookmarksController {
  constructor(private readonly bookmarksService: BookmarksService) {}

  @Post('toggle')
  @ApiOperation({ summary: 'Toggle bookmark' })
  toggle(@Body() body: { userId: string; targetType: string; targetId: string; note?: string }) {
    return this.bookmarksService.toggleBookmark(body.userId, body.targetType, body.targetId, body.note);
  }

  @Get(':userId')
  @ApiOperation({ summary: 'Get user bookmarks' })
  getUserBookmarks(
    @Param('userId') userId: string,
    @Query('type') type?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.bookmarksService.getUserBookmarks(
      userId,
      type,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  @Get(':userId/check')
  @ApiOperation({ summary: 'Check if bookmarked' })
  check(
    @Param('userId') userId: string,
    @Query('targetType') targetType: string,
    @Query('targetId') targetId: string,
  ) {
    return this.bookmarksService.isBookmarked(userId, targetType, targetId);
  }

  @Get(':userId/stats')
  @ApiOperation({ summary: 'Get bookmark stats' })
  stats(@Param('userId') userId: string) {
    return this.bookmarksService.getBookmarkStats(userId);
  }

  @Patch(':id/note')
  @ApiOperation({ summary: 'Update bookmark note' })
  updateNote(
    @Param('id') id: string,
    @Body() body: { userId: string; note: string },
  ) {
    return this.bookmarksService.updateNote(body.userId, id, body.note);
  }
}
