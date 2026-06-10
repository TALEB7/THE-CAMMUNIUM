import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MessagingService } from './messaging.service';
import { RedisService } from '../redis/redis.service';

@WebSocketGateway({
  cors: { origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000', credentials: true },
  namespace: '/chat',
})
export class MessagingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly messagingService: MessagingService,
    private readonly redis: RedisService,
  ) {}

  async handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (userId) {
      await this.redis.setOnline(userId, client.id);
      this.server.emit('userOnline', { userId });
    }
  }

  async handleDisconnect(client: Socket) {
    const userId = await this.redis.getUserIdBySocket(client.id);
    if (userId) {
      await this.redis.setOffline(userId);
      this.server.emit('userOffline', { userId });
    }
  }

  @SubscribeMessage('joinConversation')
  handleJoinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    client.join(`conversation:${data.conversationId}`);
  }

  @SubscribeMessage('leaveConversation')
  handleLeaveConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    client.leave(`conversation:${data.conversationId}`);
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() _client: Socket,
    @MessageBody()
    data: {
      conversationId: string;
      senderId: string;
      content: string;
      type?: string;
      replyToId?: string;
    },
  ) {
    const message = await this.messagingService.sendMessage(data);

    this.server
      .to(`conversation:${data.conversationId}`)
      .emit('newMessage', message);

    // Notify offline participants
    const participants = await this.messagingService.getConversationParticipants(
      data.conversationId,
    );
    for (const p of participants) {
      if (p.userId !== data.senderId && !(await this.redis.isOnline(p.userId))) {
        // Will be picked up by notification service
      }
    }

    return message;
  }

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string; userId: string },
  ) {
    client
      .to(`conversation:${data.conversationId}`)
      .emit('userTyping', { userId: data.userId });
  }

  @SubscribeMessage('stopTyping')
  handleStopTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string; userId: string },
  ) {
    client
      .to(`conversation:${data.conversationId}`)
      .emit('userStoppedTyping', { userId: data.userId });
  }

  @SubscribeMessage('markRead')
  async handleMarkRead(
    @MessageBody() data: { conversationId: string; userId: string; messageId: string },
  ) {
    await this.messagingService.markMessageRead(data.messageId, data.userId);
    this.server
      .to(`conversation:${data.conversationId}`)
      .emit('messageRead', { messageId: data.messageId, userId: data.userId });
  }
}
