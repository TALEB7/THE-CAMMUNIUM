import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MentorshipService {
  constructor(private prisma: PrismaService) {}

  // -- Mentor Profiles --
  async createMentorProfile(userId: string, data: any) {
    return this.prisma.mentorProfile.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    });
  }

  async getMentorProfile(userId: string) {
    return this.prisma.mentorProfile.findUnique({
      where: { userId },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        reviews: {
          include: { mentee: { select: { firstName: true, lastName: true } } },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });
  }

  async searchMentors(filters: {
    expertise?: string;
    industry?: string;
    minRating?: number;
    maxRate?: number;
    page?: number;
    limit?: number;
  }) {
    const { page = 1, limit = 12 } = filters;
    const where: any = { isAvailable: true };

    if (filters.expertise) {
      where.expertise = { has: filters.expertise };
    }
    if (filters.industry) {
      where.industries = { has: filters.industry };
    }
    if (filters.minRating) {
      where.rating = { gte: filters.minRating };
    }
    if (filters.maxRate) {
      where.hourlyRate = { lte: filters.maxRate };
    }

    const [mentors, total] = await Promise.all([
      this.prisma.mentorProfile.findMany({
        where,
        include: {
          user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        },
        orderBy: { rating: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.mentorProfile.count({ where }),
    ]);

    return { mentors, total, page, totalPages: Math.ceil(total / limit) };
  }

  // -- Mentorship Requests --
  async createRequest(mentorProfileId: string, menteeId: string, data: { message?: string; goals?: string }) {
    const mentor = await this.prisma.mentorProfile.findUnique({
      where: { id: mentorProfileId },
    });

    if (!mentor) throw new NotFoundException('Mentor non trouve');
    if (!mentor.isAvailable) throw new BadRequestException('Mentor non disponible');
    if (mentor.activeMentees >= mentor.maxMentees) throw new BadRequestException('Mentor complet');
    if (mentor.userId === menteeId) throw new BadRequestException('Vous ne pouvez pas etre votre propre mentee');

    return this.prisma.mentorshipRequest.create({
      data: {
        mentorId: mentorProfileId,
        menteeId,
        message: data.message,
        goals: data.goals,
      },
    });
  }

  async respondToRequest(requestId: string, mentorUserId: string, status: 'ACCEPTED' | 'DECLINED') {
    const request = await this.prisma.mentorshipRequest.findUnique({
      where: { id: requestId },
      include: { mentor: true },
    });

    if (!request) throw new NotFoundException('Demande non trouvee');
    if (request.mentor.userId !== mentorUserId) throw new BadRequestException('Non autorise');

    const updated = await this.prisma.mentorshipRequest.update({
      where: { id: requestId },
      data: { status, respondedAt: new Date() },
    });

    if (status === 'ACCEPTED') {
      await this.prisma.mentorProfile.update({
        where: { id: request.mentorId },
        data: { activeMentees: { increment: 1 } },
      });
    }

    return updated;
  }

  async getUserRequests(userId: string, role: 'mentor' | 'mentee') {
    if (role === 'mentee') {
      return this.prisma.mentorshipRequest.findMany({
        where: { menteeId: userId },
        include: {
          mentor: {
            include: { user: { select: { firstName: true, lastName: true, avatarUrl: true } } },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    const mentorProfile = await this.prisma.mentorProfile.findUnique({ where: { userId } });
    if (!mentorProfile) return [];

    return this.prisma.mentorshipRequest.findMany({
      where: { mentorId: mentorProfile.id },
      include: {
        mentee: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // -- Sessions --
  async createSession(data: {
    mentorProfileId: string;
    menteeId: string;
    title: string;
    description?: string;
    scheduledAt: string;
    duration?: number;
    meetingUrl?: string;
    tksCost?: number;
  }) {
    return this.prisma.mentorshipSession.create({
      data: {
        mentorId: data.mentorProfileId,
        menteeId: data.menteeId,
        title: data.title,
        description: data.description,
        scheduledAt: new Date(data.scheduledAt),
        duration: data.duration || 60,
        meetingUrl: data.meetingUrl,
        tksCost: data.tksCost || 0,
      },
    });
  }

  async getUserSessions(userId: string, status?: string) {
    const mentorProfile = await this.prisma.mentorProfile.findUnique({ where: { userId } });

    const where: any = {
      OR: [
        { menteeId: userId },
        ...(mentorProfile ? [{ mentorId: mentorProfile.id }] : []),
      ],
    };
    if (status) where.status = status;

    return this.prisma.mentorshipSession.findMany({
      where,
      include: {
        mentor: {
          include: { user: { select: { firstName: true, lastName: true, avatarUrl: true } } },
        },
        mentee: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      },
      orderBy: { scheduledAt: 'asc' },
    });
  }

  async completeSession(sessionId: string, userId: string, notes?: string) {
    const session = await this.prisma.mentorshipSession.findUnique({
      where: { id: sessionId },
      include: { mentor: true },
    });

    if (!session) throw new NotFoundException('Session non trouvee');

    return this.prisma.mentorshipSession.update({
      where: { id: sessionId },
      data: { status: 'COMPLETED', completedAt: new Date(), notes },
    });
  }

  // -- Reviews --
  async createReview(mentorProfileId: string, menteeId: string, data: { rating: number; comment?: string }) {
    const review = await this.prisma.mentorshipReview.create({
      data: {
        mentorId: mentorProfileId,
        menteeId,
        rating: data.rating,
        comment: data.comment,
      },
    });

    // Update mentor average rating
    const stats = await this.prisma.mentorshipReview.aggregate({
      where: { mentorId: mentorProfileId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await this.prisma.mentorProfile.update({
      where: { id: mentorProfileId },
      data: {
        rating: stats._avg.rating || 0,
        totalReviews: stats._count.rating,
      },
    });

    return review;
  }
}
