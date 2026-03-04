import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ConnectionsService {
  constructor(private prisma: PrismaService) {}

  // ── Send connection request ──

  async sendRequest(fromId: string, toId: string, message?: string) {
    if (fromId === toId) throw new BadRequestException('Vous ne pouvez pas vous connecter à vous-même');

    // Check if already connected (either direction)
    const existing = await this.prisma.connection.findFirst({
      where: {
        OR: [
          { fromId, toId },
          { fromId: toId, toId: fromId },
        ],
      },
    });

    if (existing) {
      if (existing.status === 'ACCEPTED') throw new BadRequestException('Vous êtes déjà connecté');
      if (existing.status === 'PENDING') throw new BadRequestException('Une demande est déjà en cours');
      if (existing.status === 'BLOCKED') throw new BadRequestException('Cette connexion est bloquée');
    }

    return this.prisma.connection.create({
      data: { fromId, toId, message },
      include: {
        to: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      },
    });
  }

  // ── Accept / Reject / Cancel ──

  async respondToRequest(id: string, userId: string, action: 'ACCEPTED' | 'REJECTED') {
    const conn = await this.prisma.connection.findFirst({ where: { id, toId: userId, status: 'PENDING' } });
    if (!conn) throw new NotFoundException('Demande de connexion non trouvée');
    return this.prisma.connection.update({
      where: { id },
      data: { status: action },
      include: {
        from: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      },
    });
  }

  async cancelRequest(id: string, userId: string) {
    const conn = await this.prisma.connection.findFirst({ where: { id, fromId: userId, status: 'PENDING' } });
    if (!conn) throw new NotFoundException('Demande non trouvée');
    return this.prisma.connection.delete({ where: { id } });
  }

  async removeConnection(id: string, userId: string) {
    const conn = await this.prisma.connection.findFirst({
      where: {
        id,
        status: 'ACCEPTED',
        OR: [{ fromId: userId }, { toId: userId }],
      },
    });
    if (!conn) throw new NotFoundException('Connexion non trouvée');
    return this.prisma.connection.delete({ where: { id } });
  }

  async blockUser(fromId: string, toId: string) {
    // Delete any existing connection
    await this.prisma.connection.deleteMany({
      where: {
        OR: [
          { fromId, toId },
          { fromId: toId, toId: fromId },
        ],
      },
    });
    return this.prisma.connection.create({ data: { fromId, toId, status: 'BLOCKED' } });
  }

  // ── Get connections ──

  async getConnections(userId: string) {
    const connections = await this.prisma.connection.findMany({
      where: {
        status: 'ACCEPTED',
        OR: [{ fromId: userId }, { toId: userId }],
      },
      include: {
        from: { select: { id: true, firstName: true, lastName: true, avatarUrl: true, email: true } },
        to: { select: { id: true, firstName: true, lastName: true, avatarUrl: true, email: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Return the "other" user for each connection
    return connections.map((c) => ({
      connectionId: c.id,
      user: c.fromId === userId ? c.to : c.from,
      connectedAt: c.updatedAt,
    }));
  }

  async getPendingRequests(userId: string) {
    return this.prisma.connection.findMany({
      where: { toId: userId, status: 'PENDING' },
      include: {
        from: { select: { id: true, firstName: true, lastName: true, avatarUrl: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getSentRequests(userId: string) {
    return this.prisma.connection.findMany({
      where: { fromId: userId, status: 'PENDING' },
      include: {
        to: { select: { id: true, firstName: true, lastName: true, avatarUrl: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getConnectionStatus(userId: string, targetId: string) {
    const conn = await this.prisma.connection.findFirst({
      where: {
        OR: [
          { fromId: userId, toId: targetId },
          { fromId: targetId, toId: userId },
        ],
      },
    });
    if (!conn) return { status: 'NONE' };
    return { status: conn.status, connectionId: conn.id, direction: conn.fromId === userId ? 'SENT' : 'RECEIVED' };
  }

  async getConnectionCount(userId: string) {
    return this.prisma.connection.count({
      where: {
        status: 'ACCEPTED',
        OR: [{ fromId: userId }, { toId: userId }],
      },
    });
  }

  // ── Suggestions (people you may know) ──

  async getSuggestions(userId: string, limit = 10) {
    // Get user's connections
    const myConnections = await this.prisma.connection.findMany({
      where: {
        status: 'ACCEPTED',
        OR: [{ fromId: userId }, { toId: userId }],
      },
      select: { fromId: true, toId: true },
    });

    const connectedIds = new Set<string>();
    connectedIds.add(userId);
    myConnections.forEach((c) => {
      connectedIds.add(c.fromId);
      connectedIds.add(c.toId);
    });

    // Also exclude pending/blocked
    const excluded = await this.prisma.connection.findMany({
      where: {
        OR: [{ fromId: userId }, { toId: userId }],
        status: { in: ['PENDING', 'BLOCKED'] },
      },
      select: { fromId: true, toId: true },
    });
    excluded.forEach((c) => {
      connectedIds.add(c.fromId);
      connectedIds.add(c.toId);
    });

    return this.prisma.user.findMany({
      where: {
        id: { notIn: Array.from(connectedIds) },
        isActive: true,
      },
      select: { id: true, firstName: true, lastName: true, avatarUrl: true, email: true },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
  }
}
