import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EventsService {
  constructor(private prisma: PrismaService) {}

  // ── Browse events ──

  async getEvents(filters: {
    city?: string;
    category?: string;
    eventType?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const { city, category, eventType, status, page = 1, limit = 20 } = filters;
    const where: any = { isPublic: true };
    if (city) where.city = { contains: city, mode: 'insensitive' };
    if (category) where.category = category;
    if (eventType) where.eventType = eventType;
    if (status) where.status = status;
    else where.status = { in: ['UPCOMING', 'LIVE'] };

    const [events, total] = await Promise.all([
      this.prisma.event.findMany({
        where,
        include: {
          organizer: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
          _count: { select: { rsvps: true } },
        },
        orderBy: { startDate: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.event.count({ where }),
    ]);
    return { events, total, page, totalPages: Math.ceil(total / limit) };
  }

  async getEvent(id: string) {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: {
        organizer: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        rsvps: {
          include: { user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    if (!event) throw new NotFoundException('Événement non trouvé');
    await this.prisma.event.update({ where: { id }, data: { viewCount: { increment: 1 } } });
    return event;
  }

  // ── Create / Update / Delete ──

  async createEvent(data: {
    organizerId: string;
    title: string;
    description: string;
    coverImage?: string;
    eventType?: string;
    category?: string;
    location?: string;
    city?: string;
    onlineUrl?: string;
    startDate: string;
    endDate: string;
    maxAttendees?: number;
    price?: number;
    tags?: string[];
  }) {
    const slug = data.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') + '-' + Date.now().toString(36);

    return this.prisma.event.create({
      data: {
        organizerId: data.organizerId,
        title: data.title,
        slug,
        description: data.description,
        coverImage: data.coverImage,
        eventType: data.eventType || 'IN_PERSON',
        category: data.category,
        location: data.location,
        city: data.city,
        onlineUrl: data.onlineUrl,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        maxAttendees: data.maxAttendees,
        price: data.price ?? 0,
        tags: data.tags || [],
      },
      include: {
        organizer: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      },
    });
  }

  async updateEvent(id: string, organizerId: string, data: any) {
    const event = await this.prisma.event.findFirst({ where: { id, organizerId } });
    if (!event) throw new NotFoundException('Événement non trouvé');
    const updateData: any = { ...data };
    if (data.startDate) updateData.startDate = new Date(data.startDate);
    if (data.endDate) updateData.endDate = new Date(data.endDate);
    delete updateData.organizerId;
    return this.prisma.event.update({ where: { id }, data: updateData });
  }

  async deleteEvent(id: string, organizerId: string) {
    const event = await this.prisma.event.findFirst({ where: { id, organizerId } });
    if (!event) throw new NotFoundException('Événement non trouvé');
    return this.prisma.event.delete({ where: { id } });
  }

  async cancelEvent(id: string, organizerId: string) {
    const event = await this.prisma.event.findFirst({ where: { id, organizerId } });
    if (!event) throw new NotFoundException('Événement non trouvé');
    return this.prisma.event.update({ where: { id }, data: { status: 'CANCELED' } });
  }

  // ── RSVP ──

  async rsvp(eventId: string, userId: string, status: string = 'GOING') {
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new NotFoundException('Événement non trouvé');

    if (status === 'GOING' && event.maxAttendees && event.currentAttendees >= event.maxAttendees) {
      status = 'WAITLISTED';
    }

    const rsvp = await this.prisma.eventRsvp.upsert({
      where: { eventId_userId: { eventId, userId } },
      update: { status },
      create: { eventId, userId, status },
    });

    // Recount attendees
    const goingCount = await this.prisma.eventRsvp.count({ where: { eventId, status: 'GOING' } });
    await this.prisma.event.update({ where: { id: eventId }, data: { currentAttendees: goingCount } });

    return rsvp;
  }

  async cancelRsvp(eventId: string, userId: string) {
    const rsvp = await this.prisma.eventRsvp.findUnique({ where: { eventId_userId: { eventId, userId } } });
    if (!rsvp) throw new NotFoundException('Inscription non trouvée');
    await this.prisma.eventRsvp.delete({ where: { id: rsvp.id } });

    const goingCount = await this.prisma.eventRsvp.count({ where: { eventId, status: 'GOING' } });
    await this.prisma.event.update({ where: { id: eventId }, data: { currentAttendees: goingCount } });

    return { canceled: true };
  }

  // ── My events ──

  async getMyEvents(userId: string) {
    return this.prisma.event.findMany({
      where: { organizerId: userId },
      include: { _count: { select: { rsvps: true } } },
      orderBy: { startDate: 'desc' },
    });
  }

  async getMyRsvps(userId: string) {
    return this.prisma.eventRsvp.findMany({
      where: { userId },
      include: {
        event: {
          include: {
            organizer: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
