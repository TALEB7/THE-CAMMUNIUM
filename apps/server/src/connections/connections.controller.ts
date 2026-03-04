import { Controller, Get, Post, Patch, Delete, Param, Query, Body } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ConnectionsService } from './connections.service';
import { SendConnectionRequestDto, RespondConnectionRequestDto, BlockUserDto } from './dto';

@ApiTags('connections')
@Controller('connections')
export class ConnectionsController {
  constructor(private readonly service: ConnectionsService) {}

  @Post('request')
  sendRequest(@Body() body: SendConnectionRequestDto) {
    return this.service.sendRequest(body.fromId, body.toId, body.message);
  }

  @Patch(':id/respond')
  respondToRequest(
    @Param('id') id: string,
    @Body() body: RespondConnectionRequestDto,
  ) {
    return this.service.respondToRequest(id, body.userId, body.action);
  }

  @Delete(':id/cancel')
  cancelRequest(@Param('id') id: string, @Body('userId') userId: string) {
    return this.service.cancelRequest(id, userId);
  }

  @Delete(':id')
  removeConnection(@Param('id') id: string, @Body('userId') userId: string) {
    return this.service.removeConnection(id, userId);
  }

  @Post('block')
  blockUser(@Body() body: BlockUserDto) {
    return this.service.blockUser(body.fromId, body.toId);
  }

  @Get(':userId')
  getConnections(@Param('userId') userId: string) {
    return this.service.getConnections(userId);
  }

  @Get(':userId/pending')
  getPendingRequests(@Param('userId') userId: string) {
    return this.service.getPendingRequests(userId);
  }

  @Get(':userId/sent')
  getSentRequests(@Param('userId') userId: string) {
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
  getSuggestions(@Param('userId') userId: string, @Query('limit') limit?: number) {
    return this.service.getSuggestions(userId, limit);
  }
}
