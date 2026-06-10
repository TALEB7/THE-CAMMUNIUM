import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MeetingsService {
  constructor(private prisma: PrismaService) {}

  // ── Create a meeting ──
  async createMeeting(data: { groupId: string; hostId: string; title: string; maxParticipants?: number }) {
    // Verify user is a member of the group
    const member = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: data.groupId, userId: data.hostId } },
    });
    if (!member) throw new ForbiddenException('Vous devez être membre du groupe pour créer une réunion');

    // Check no active meeting in this group
    const activeMeeting = await this.prisma.groupMeeting.findFirst({
      where: { groupId: data.groupId, status: { in: ['WAITING', 'LIVE'] } },
    });
    if (activeMeeting) throw new BadRequestException('Une réunion est déjà en cours dans ce groupe');

    return this.prisma.groupMeeting.create({
      data: {
        groupId: data.groupId,
        hostId: data.hostId,
        title: data.title,
        maxParticipants: data.maxParticipants || 10,
        status: 'WAITING',
      },
      include: {
        host: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        group: { select: { id: true, name: true } },
      },
    });
  }

  // ── Get meeting by ID ──
  async getMeeting(id: string) {
    const meeting = await this.prisma.groupMeeting.findUnique({
      where: { id },
      include: {
        host: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        group: { select: { id: true, name: true, ownerId: true } },
        participants: {
          where: { leftAt: null },
          include: {
            user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
          },
        },
      },
    });
    if (!meeting) throw new NotFoundException('Réunion non trouvée');
    return meeting;
  }

  // ── Get active meeting for a group ──
  async getActiveMeeting(groupId: string) {
    return this.prisma.groupMeeting.findFirst({
      where: { groupId, status: { in: ['WAITING', 'LIVE'] } },
      include: {
        host: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        participants: {
          where: { leftAt: null },
          include: {
            user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
          },
        },
      },
    });
  }

  // ── Get group meetings history ──
  async getGroupMeetings(groupId: string, page = 1, limit = 10) {
    const [meetings, total] = await Promise.all([
      this.prisma.groupMeeting.findMany({
        where: { groupId },
        include: {
          host: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
          _count: { select: { participants: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.groupMeeting.count({ where: { groupId } }),
    ]);
    return { meetings, total, page, totalPages: Math.ceil(total / limit) };
  }

  // ── Join meeting ──
  async joinMeeting(meetingId: string, userId: string) {
    const meeting = await this.prisma.groupMeeting.findUnique({
      where: { id: meetingId },
      include: { participants: { where: { leftAt: null } } },
    });
    if (!meeting) throw new NotFoundException('Réunion non trouvée');
    if (meeting.status === 'ENDED') throw new BadRequestException('La réunion est terminée');

    // Check membership in the group
    const member = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: meeting.groupId, userId } },
    });
    if (!member) throw new ForbiddenException('Vous devez être membre du groupe');

    // Check capacity
    if (meeting.participants.length >= meeting.maxParticipants) {
      throw new BadRequestException('La réunion est pleine');
    }

    // Upsert participant (in case they left and rejoin)
    const existing = await this.prisma.groupMeetingParticipant.findUnique({
      where: { meetingId_userId: { meetingId, userId } },
    });

    if (existing) {
      return this.prisma.groupMeetingParticipant.update({
        where: { id: existing.id },
        data: { leftAt: null, joinedAt: new Date() },
        include: { user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } },
      });
    }

    // Start meeting if first join and status is WAITING
    if (meeting.status === 'WAITING') {
      await this.prisma.groupMeeting.update({
        where: { id: meetingId },
        data: { status: 'LIVE', startedAt: new Date() },
      });
    }

    return this.prisma.groupMeetingParticipant.create({
      data: { meetingId, userId },
      include: { user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } },
    });
  }

  // ── Leave meeting ──
  async leaveMeeting(meetingId: string, userId: string) {
    const participant = await this.prisma.groupMeetingParticipant.findUnique({
      where: { meetingId_userId: { meetingId, userId } },
    });
    if (!participant) return { left: true };

    await this.prisma.groupMeetingParticipant.update({
      where: { id: participant.id },
      data: { leftAt: new Date() },
    });

    // Check if no more participants
    const remaining = await this.prisma.groupMeetingParticipant.count({
      where: { meetingId, leftAt: null },
    });

    if (remaining === 0) {
      await this.prisma.groupMeeting.update({
        where: { id: meetingId },
        data: { status: 'ENDED', endedAt: new Date() },
      });
    }

    return { left: true };
  }

  // ── End meeting (host only) ──
  async endMeeting(meetingId: string, userId: string) {
    const meeting = await this.prisma.groupMeeting.findUnique({ where: { id: meetingId } });
    if (!meeting) throw new NotFoundException('Réunion non trouvée');
    if (meeting.hostId !== userId) throw new ForbiddenException('Seul l\'hôte peut terminer la réunion');

    // Mark all participants as left
    await this.prisma.groupMeetingParticipant.updateMany({
      where: { meetingId, leftAt: null },
      data: { leftAt: new Date() },
    });

    return this.prisma.groupMeeting.update({
      where: { id: meetingId },
      data: { status: 'ENDED', endedAt: new Date() },
      include: {
        host: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        group: { select: { id: true, name: true } },
      },
    });
  }
}
