import { Controller, Get, Post, Patch, Delete, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ConnectionsService } from './connections.service';
import { SendConnectionRequestDto, RespondConnectionRequestDto, BlockUserDto } from './dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('connections')
@UseGuards(JwtAuthGuard)
@Controller('connections')
export class ConnectionsController {
  constructor(private readonly service: ConnectionsService) {}

  @Post('request')
  sendRequest(@CurrentUser('id') fromId: string, @Body() body: SendConnectionRequestDto) {
    return this.service.sendRequest(fromId, body.toId, body.message);
  }

  @Patch(':id/respond')
  respondToRequest(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() body: RespondConnectionRequestDto,
  ) {
    return this.service.respondToRequest(id, userId, body.action);
  }

  @Delete(':id/cancel')
  cancelRequest(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.service.cancelRequest(id, userId);
  }

  @Delete(':id')
  removeConnection(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.service.removeConnection(id, userId);
  }

  @Post('block')
  blockUser(@CurrentUser('id') fromId: string, @Body() body: BlockUserDto) {
    return this.service.blockUser(fromId, body.toId);
  }

  @Get(':userId')
  getConnections(@Param('userId') userId: string) {
    return this.service.getConnections(userId);
  }

  @Get(':userId/pending')
  getPendingRequests(@CurrentUser('id') userId: string) {
    return this.service.getPendingRequests(userId);
  }

  @Get(':userId/sent')
  getSentRequests(@CurrentUser('id') userId: string) {
    return this.service.getSentRequests(userId);
  }

  @Get(':userId/status/:targetId')
  getConnectionStatus(@Param('userId') userId: string, @Param('targetId') targetId: string) {
    return this.service.getConnectionStatus(userId, targetId);
  }

  @Get(':userId/count')
  getConnectionCount(@Param('userId') userId: string) {
    return this.service.getConnectionCount(userId);
  }

  @Get(':userId/suggestions')
  getSuggestions(@CurrentUser('id') userId: string, @Query('limit') limit?: number) {
    return this.service.getSuggestions(userId, limit);
  }
}
