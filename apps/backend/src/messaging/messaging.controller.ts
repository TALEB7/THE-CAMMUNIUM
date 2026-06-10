import {
  Controller, Get, Post, Delete, Body, Param, Query, HttpCode, HttpStatus,
} from '@nestjs/common';
import { MessagingService } from './messaging.service';

@Controller('messaging')
export class MessagingController {
  constructor(private readonly messagingService: MessagingService) {}

  @Post('conversations')
  async createConversation(
    @Body() body: { participantIds: string[]; type?: string; title?: string },
  ) {
    return this.messagingService.createConversation(
      body.participantIds,
      body.type,
      body.title,
    );
  }

  @Get('conversations/:userId')
  async getUserConversations(@Param('userId') userId: string) {
    return this.messagingService.getUserConversations(userId);
  }

  @Get('conversations/:conversationId/messages')
  async getMessages(
    @Param('conversationId') conversationId: string,
    @Query('cursor') cursor?: string,
    @Query('take') take?: string,
  ) {
    return this.messagingService.getConversationMessages(
      conversationId,
      cursor,
      take ? parseInt(take) : 50,
    );
  }

  @Post('messages')
  async sendMessage(
    @Body() body: {
      conversationId: string;
      senderId: string;
      content: string;
      type?: string;
      replyToId?: string;
    },
  ) {
    return this.messagingService.sendMessage(body);
  }

  @Delete('messages/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteMessage(
    @Param('id') id: string,
    @Body('userId') userId: string,
  ) {
    await this.messagingService.deleteMessage(id, userId);
  }

  @Get('unread/:userId')
  async getUnreadCount(@Param('userId') userId: string) {
    const count = await this.messagingService.getUnreadCount(userId);
    return { unreadCount: count };
  }
}
