import { Controller, Get, Post, Put, Delete, Patch, Param, Query, Body } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ForumsService } from './forums.service';
import { CreateForumDto, CreateForumPostDto, UpdateForumPostDto, CreateForumCommentDto } from './dto';

@ApiTags('forums')
@Controller('forums')
export class ForumsController {
  constructor(private readonly service: ForumsService) {}

  // ── Forums ──

  @Get()
  getForums() {
    return this.service.getForums();
  }

  @Get(':slug')
  getForumBySlug(@Param('slug') slug: string) {
    return this.service.getForumBySlug(slug);
  }

  @Post()
  createForum(@Body() body: CreateForumDto) {
    return this.service.createForum(body);
  }

  // ── Posts ──

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

  @Post('posts')
  createPost(
    @Body() body: CreateForumPostDto,
  ) {
    return this.service.createPost(body);
  }

  @Put('posts/:id')
  updatePost(
    @Param('id') id: string,
    @Body() body: UpdateForumPostDto,
  ) {
    return this.service.updatePost(id, body.authorId, body);
  }

  @Delete('posts/:id')
  deletePost(@Param('id') id: string, @Body('authorId') authorId: string) {
    return this.service.deletePost(id, authorId);
  }

  // ── Comments ──

  @Post('posts/:postId/comments')
  addComment(
    @Param('postId') postId: string,
    @Body() body: CreateForumCommentDto,
  ) {
    return this.service.addComment({ ...body, postId });
  }

  @Delete('comments/:id')
  deleteComment(@Param('id') id: string, @Body('authorId') authorId: string) {
    return this.service.deleteComment(id, authorId);
  }

  // ── Likes ──

  @Post('posts/:postId/like')
  toggleLike(@Param('postId') postId: string, @Body('userId') userId: string) {
    return this.service.toggleLike(postId, userId);
  }

  // ── Admin ──

  @Patch('posts/:id/pin')
  pinPost(@Param('id') id: string, @Body('pinned') pinned: boolean) {
    return this.service.pinPost(id, pinned);
  }

  @Patch('posts/:id/lock')
  lockPost(@Param('id') id: string, @Body('locked') locked: boolean) {
    return this.service.lockPost(id, locked);
  }
}
