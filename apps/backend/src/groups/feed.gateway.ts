import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { OnModuleInit } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { RedisService } from '../redis/redis.service';

/**
 * Real-time feed gateway for group likes and comments.
 * Clients join rooms like `group:<id>` to receive live updates.
 * Redis Pub/Sub channels:
 *   - `group:likes`    → payload: { postId, groupId, userId, likeCount, liked }
 *   - `group:comments` → payload: { postId, groupId, comment }
 *
 * NOTE: subscriptions are set up in onModuleInit (not afterInit) to ensure
 * RedisService.onModuleInit has already run and subscriber connection exists.
 */
@WebSocketGateway({
  cors: {
    origin: (_origin: string | undefined, cb: (err: Error | null, allow?: boolean) => void) => {
      cb(null, true);
    },
    credentials: true,
  },
  namespace: '/feed',
})
export class FeedGateway implements OnModuleInit {
  @WebSocketServer()
  server!: Server;

  constructor(private readonly redis: RedisService) {}

  onModuleInit() {
    this.redis.subscribe('group:likes', (payload) => {
      this.server?.to(`group:${payload.groupId}`).emit('postLiked', payload);
    });

    this.redis.subscribe('group:comments', (payload) => {
      this.server?.to(`group:${payload.groupId}`).emit('newComment', payload);
    });
  }

  @SubscribeMessage('joinGroup')
  handleJoinGroup(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { groupId: string },
  ) {
    client.join(`group:${data.groupId}`);
    return { joined: data.groupId };
  }

  @SubscribeMessage('leaveGroup')
  handleLeaveGroup(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { groupId: string },
  ) {
    client.leave(`group:${data.groupId}`);
    return { left: data.groupId };
  }
}
