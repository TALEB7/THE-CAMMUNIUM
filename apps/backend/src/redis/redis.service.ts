import { Injectable, OnModuleDestroy, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client!: Redis;
  private subscriber!: Redis; // dedicated connection for pub/sub
  private readonly handlers = new Map<string, Set<(payload: any) => void>>();
  private isMessageListenerRegistered = false;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const url = this.config.get<string>('REDIS_URL', 'redis://localhost:6379');
    const opts = { lazyConnect: true, retryStrategy: (t: number) => Math.min(t * 100, 3000) };

    this.client = new Redis(url, opts);
    this.subscriber = new Redis(url, opts);

    this.client.on('connect', () => this.logger.log('Redis connected'));
    this.client.on('error', (err) => this.logger.error('Redis error', err));
    this.subscriber.on('error', (err) => this.logger.error('Redis subscriber error', err));
  }

  async onModuleDestroy() {
    this.handlers.clear();
    await this.subscriber.quit();
    await this.client.quit();
  }

  // ── Online users (Hash: userId -> socketId) ──

  private readonly ONLINE_KEY = 'online_users';

  async setOnline(userId: string, socketId: string): Promise<void> {
    await this.client.hset(this.ONLINE_KEY, userId, socketId);
  }

  async setOffline(userId: string): Promise<void> {
    await this.client.hdel(this.ONLINE_KEY, userId);
  }

  async getSocketId(userId: string): Promise<string | null> {
    return this.client.hget(this.ONLINE_KEY, userId);
  }

  async isOnline(userId: string): Promise<boolean> {
    return (await this.client.hexists(this.ONLINE_KEY, userId)) === 1;
  }

  async getUserIdBySocket(socketId: string): Promise<string | null> {
    const all = await this.client.hgetall(this.ONLINE_KEY);
    const entry = Object.entries(all).find(([, sid]) => sid === socketId);
    return entry ? entry[0] : null;
  }

  async getAllOnlineUsers(): Promise<Record<string, string>> {
    return this.client.hgetall(this.ONLINE_KEY);
  }

  // ── Generic cache ──

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.client.set(key, value, 'EX', ttlSeconds);
    } else {
      await this.client.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  // ── Pub / Sub ──

  /**
   * Publish a JSON payload to a Redis channel.
   * Used by services (forums, groups, feed) to broadcast real-time events.
   */
  async publish(channel: string, payload: object): Promise<void> {
    await this.client.publish(channel, JSON.stringify(payload));
  }

  /**
   * Subscribe to a Redis channel and invoke the handler on each message.
   * Used by Socket.IO gateways to forward events to connected clients.
   */
  subscribe(channel: string, handler: (payload: any) => void): void {
    if (!this.handlers.has(channel)) {
      this.handlers.set(channel, new Set());
      this.subscriber.subscribe(channel, (err) => {
        if (err) this.logger.error(`Failed to subscribe to ${channel}`, err);
      });
    }

    this.handlers.get(channel)!.add(handler);

    if (!this.isMessageListenerRegistered) {
      this.subscriber.on('message', (ch, message) => {
        const channelHandlers = this.handlers.get(ch);
        if (channelHandlers && channelHandlers.size > 0) {
          try {
            const parsed = JSON.parse(message);
            channelHandlers.forEach((cb) => {
              try {
                cb(parsed);
              } catch (cbErr: any) {
                this.logger.error(`Error in subscriber handler for channel ${ch}: ${cbErr?.message || cbErr}`);
              }
            });
          } catch {
            this.logger.warn(`Bad JSON on channel ${ch}: ${message}`);
          }
        }
      });
      this.isMessageListenerRegistered = true;
    }
  }

  /**
   * Unsubscribe a handler from a Redis channel.
   */
  unsubscribe(channel: string, handler: (payload: any) => void): void {
    const channelHandlers = this.handlers.get(channel);
    if (channelHandlers) {
      channelHandlers.delete(handler);
      if (channelHandlers.size === 0) {
        this.handlers.delete(channel);
        this.subscriber.unsubscribe(channel).catch((err) => {
          this.logger.error(`Failed to unsubscribe from channel ${channel}`, err);
        });
      }
    }
  }
}
