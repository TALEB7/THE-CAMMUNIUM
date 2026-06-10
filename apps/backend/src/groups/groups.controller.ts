import { Controller, Get, Post, Put, Delete, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GroupsService } from './groups.service';
import { CreateGroupDto, UpdateGroupDto, CreateGroupPostDto, CreateGroupCommentDto } from './dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('groups')
@Controller('groups')
export class GroupsController {
  constructor(private readonly service: GroupsService) {}

  // ── Groups — public reads ───────────────────────────────────────────────────

  @Get()
  getGroups(
    @Query('category') category?: string,
    @Query('q') q?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.service.getGroups({ category, q, page, limit });
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  getMyGroups(@CurrentUser('id') userId: string) {
    return this.service.getMyGroups(userId);
  }

  @Get(':id')
  getGroup(@Param('id') id: string) {
    return this.service.getGroup(id);
  }

  // ── Groups — authenticated mutations ────────────────────────────────────────

  @Post()
  @UseGuards(JwtAuthGuard)
  createGroup(@CurrentUser('id') userId: string, @Body() body: CreateGroupDto) {
    return this.service.createGroup({ ...body, ownerId: userId });
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  updateGroup(@Param('id') id: string, @CurrentUser('id') userId: string, @Body() body: UpdateGroupDto) {
    return this.service.updateGroup(id, userId, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  deleteGroup(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.service.deleteGroup(id, userId);
  }

  // ── Membership ──────────────────────────────────────────────────────────────

  @Post(':id/join')
  @UseGuards(JwtAuthGuard)
  joinGroup(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.service.joinGroup(id, userId);
  }

  @Delete(':id/leave')
  @UseGuards(JwtAuthGuard)
  leaveGroup(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.service.leaveGroup(id, userId);
  }

  // ── Group Posts ──────────────────────────────────────────────────────────────

  @Get(':id/posts')
  getGroupPosts(@Param('id') id: string, @Query('page') page?: number, @Query('limit') limit?: number) {
    return this.service.getGroupPosts(id, page, limit);
  }

  @Post(':id/posts')
  @UseGuards(JwtAuthGuard)
  createGroupPost(@Param('id') groupId: string, @CurrentUser('id') userId: string, @Body() body: CreateGroupPostDto) {
    return this.service.createGroupPost({ ...body, groupId, authorId: userId });
  }

  @Delete('posts/:id')
  @UseGuards(JwtAuthGuard)
  deleteGroupPost(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.service.deleteGroupPost(id, userId);
  }

  // ── Group Comments ────────────────────────────────────────────────────────────

  @Post('posts/:postId/comments')
  @UseGuards(JwtAuthGuard)
  addGroupComment(
    @Param('postId') postId: string,
    @CurrentUser('id') userId: string,
    @Body() body: CreateGroupCommentDto,
  ) {
    return this.service.addGroupComment({ ...body, postId, authorId: userId });
  }

  // ── Likes ─────────────────────────────────────────────────────────────────────

  @Post('posts/:postId/like')
  @UseGuards(JwtAuthGuard)
  toggleLike(@Param('postId') postId: string, @CurrentUser('id') userId: string) {
    return this.service.toggleLike(postId, userId);
  }
}
