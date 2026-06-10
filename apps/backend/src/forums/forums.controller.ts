import { Controller, Get, Post, Put, Delete, Patch, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ForumsService } from './forums.service';
import { CreateForumDto, CreateForumPostDto, UpdateForumPostDto, CreateForumCommentDto } from './dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('forums')
@Controller('forums')
export class ForumsController {
  constructor(private readonly service: ForumsService) {}

  // ── Forums — public reads ──────────────────────────────────────────────────

  @Get()
  getForums() {
    return this.service.getForums();
  }

  @Get(':slug')
  getForumBySlug(@Param('slug') slug: string) {
    return this.service.getForumBySlug(slug);
  }

  // ── Forums — admin mutations (forums are global categories) ────────────────

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  createForum(@Body() body: CreateForumDto) {
    return this.service.createForum(body);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  updateForum(@Param('id') id: string, @Body() body: any) {
    return this.service.updateForum(id, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  deleteForum(@Param('id') id: string) {
    return this.service.deleteForum(id);
  }

  // ── Posts — public reads ──────────────────────────────────────────────────

  @Get(':forumId/posts')
  getForumPosts(
    @Param('forumId') forumId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.service.getForumPosts(forumId, page, limit);
  }

  @Get('posts/:id')
  getPost(@Param('id') id: string) {
    return this.service.getPost(id);
  }

  // ── Posts — authenticated mutations ───────────────────────────────────────

  @Post('posts')
  @UseGuards(JwtAuthGuard)
  createPost(
    @CurrentUser('id') userId: string,
    @Body() body: CreateForumPostDto,
  ) {
    return this.service.createPost({ ...body, authorId: userId });
  }

  @Put('posts/:id')
  @UseGuards(JwtAuthGuard)
  updatePost(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() body: UpdateForumPostDto,
  ) {
    return this.service.updatePost(id, userId, body);
  }

  @Delete('posts/:id')
  @UseGuards(JwtAuthGuard)
  deletePost(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.service.deletePost(id, userId);
  }

  // ── Comments ──────────────────────────────────────────────────────────────

  @Post('posts/:postId/comments')
  @UseGuards(JwtAuthGuard)
  addComment(
    @Param('postId') postId: string,
    @CurrentUser('id') userId: string,
    @Body() body: CreateForumCommentDto,
  ) {
    return this.service.addComment({ ...body, postId, authorId: userId });
  }

  @Delete('comments/:id')
  @UseGuards(JwtAuthGuard)
  deleteComment(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.service.deleteComment(id, userId);
  }

  // ── Likes ─────────────────────────────────────────────────────────────────

  @Post('posts/:postId/like')
  @UseGuards(JwtAuthGuard)
  toggleLike(@Param('postId') postId: string, @CurrentUser('id') userId: string) {
    return this.service.toggleLike(postId, userId);
  }

  // ── Admin ─────────────────────────────────────────────────────────────────

  @Patch('posts/:id/pin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  pinPost(@Param('id') id: string, @Body('pinned') pinned: boolean) {
    return this.service.pinPost(id, pinned);
  }

  @Patch('posts/:id/lock')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  lockPost(@Param('id') id: string, @Body('locked') locked: boolean) {
    return this.service.lockPost(id, locked);
  }
}
