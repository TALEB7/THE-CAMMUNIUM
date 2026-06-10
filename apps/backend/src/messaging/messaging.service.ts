import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MessagingService {
  constructor(private prisma: PrismaService) {}

  async createConversation(participantIds: string[], type = 'DIRECT', title?: string) {
    // For DIRECT, check if conversation already exists
    if (type === 'DIRECT' && participantIds.length === 2) {
      const existing = await this.prisma.conversation.findFirst({
        where: {
          type: 'DIRECT',
          AND: participantIds.map((id) => ({
            participants: { some: { userId: id } },
          })),
        },
        include: {
          participants: { include: { user: true } },
          messages: { take: 1, orderBy: { createdAt: 'desc' } },
        },
      });
      if (existing) return existing;
    }

    return this.prisma.conversation.create({
      data: {
        type,
        title,
        participants: {
          create: participantIds.map((userId, i) => ({
            userId,
            role: i === 0 && type === 'GROUP' ? 'ADMIN' : 'MEMBER',
          })),
        },
      },
      include: {
        participants: { include: { user: true } },
      },
    });
  }

  async getUserConversations(userId: string) {
    return this.prisma.conversation.findMany({
      where: {
        participants: { some: { userId, isArchived: false } },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
              },
            },
          },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { lastActivity: 'desc' },
    });
  }

  async getConversationMessages(conversationId: string, cursor?: string, take = 50) {
    return this.prisma.message.findMany({
      where: { conversationId, isDeleted: false },
      include: {
        sender: {
          select: { id: true, firstName: true, lastName: true, avatarUrl: true },
        },
        replyTo: {
          select: { id: true, content: true, sender: { select: { firstName: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
      take,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    });
  }

  async sendMessage(data: {
    conversationId: string;
    senderId: string;
    content: string;
    type?: string;
    replyToId?: string;
  }) {
    const [message] = await this.prisma.$transaction([
      this.prisma.message.create({
        data: {
          conversationId: data.conversationId,
          senderId: data.senderId,
          content: data.content,
          type: data.type || 'TEXT',
          replyToId: data.replyToId,
        },
        include: {
          sender: {
            select: { id: true, firstName: true, lastName: true, avatarUrl: true },
          },
        },
      }),
      this.prisma.conversation.update({
        where: { id: data.conversationId },
        data: {
          lastMessage: data.content,
          lastActivity: new Date(),
        },
      }),
    ]);
    return message;
  }

  async getConversationParticipants(conversationId: string) {
    return this.prisma.conversationParticipant.findMany({
      where: { conversationId },
    });
  }

  async markMessageRead(messageId: string, userId: string) {
    return this.prisma.messageReadReceipt.upsert({
      where: { messageId_userId: { messageId, userId } },
      create: { messageId, userId },
      update: { readAt: new Date() },
    });
  }

  async deleteMessage(messageId: string, userId: string) {
    return this.prisma.message.updateMany({
      where: { id: messageId, senderId: userId },
      data: { isDeleted: true, content: '[Message supprime]' },
    });
  }

  async getUnreadCount(userId: string) {
    const conversations = await this.prisma.conversationParticipant.findMany({
      where: { userId },
      select: { conversationId: true, lastReadAt: true },
    });

    let total = 0;
    for (const conv of conversations) {
      const count = await this.prisma.message.count({
        where: {
          conversationId: conv.conversationId,
          senderId: { not: userId },
          createdAt: { gt: conv.lastReadAt || new Date(0) },
          isDeleted: false,
        },
      });
      total += count;
    }
    return total;
  }
}
