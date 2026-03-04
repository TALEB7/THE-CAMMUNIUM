import { Controller, Get, Post, Put, Delete, Param, Query, Body } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GroupsService } from './groups.service';
import { CreateGroupDto, UpdateGroupDto, CreateGroupPostDto, CreateGroupCommentDto } from './dto';

@ApiTags('groups')
@Controller('groups')
export class GroupsController {
  constructor(private readonly service: GroupsService) {}

  @Get()
  getGroups(
    @Query('category') category?: string,
    @Query('q') q?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.service.getGroups({ category, q, page, limit });
  }

  @Get('my/:userId')
  getMyGroups(@Param('userId') userId: string) {
    return this.service.getMyGroups(userId);
  }

  @Get(':id')
  getGroup(@Param('id') id: string) {
    return this.service.getGroup(id);
  }

  @Post()
  createGroup(@Body() body: CreateGroupDto) {
    return this.service.createGroup(body);
  }

  @Put(':id')
  updateGroup(@Param('id') id: string, @Body() body: UpdateGroupDto) {
    return this.service.updateGroup(id, body.ownerId, body);
  }

  @Delete(':id')
  deleteGroup(@Param('id') id: string, @Body('ownerId') ownerId: string) {
    return this.service.deleteGroup(id, ownerId);
  }

  // ── Membership ──

  @Post(':id/join')
  joinGroup(@Param('id') id: string, @Body('userId') userId: string) {
    return this.service.joinGroup(id, userId);
  }

  @Delete(':id/leave')
  leaveGroup(@Param('id') id: string, @Body('userId') userId: string) {
    return this.service.leaveGroup(id, userId);
  }

  // ── Group Posts ──

  @Get(':id/posts')
  getGroupPosts(@Param('id') id: string, @Query('page') page?: number, @Query('limit') limit?: number) {
    return this.service.getGroupPosts(id, page, limit);
  }

  @Post(':id/posts')
  createGroupPost(@Param('id') groupId: string, @Body() body: CreateGroupPostDto) {
    return this.service.createGroupPost({ ...body, groupId });
  }

  @Delete('posts/:id')
  deleteGroupPost(@Param('id') id: string, @Body('authorId') authorId: string) {
    return this.service.deleteGroupPost(id, authorId);
  }

  // ── Group Comments ──

  @Post('posts/:postId/comments')
  addGroupComment(
    @Param('postId') postId: string,
    @Body() body: CreateGroupCommentDto,
  ) {
    return this.service.addGroupComment({ ...body, postId });
  }
}
