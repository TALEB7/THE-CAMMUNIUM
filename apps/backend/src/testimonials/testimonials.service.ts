import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TestimonialsService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Public ──

  async getApproved(limitParam: any = 20) {
    const limit = Number(limitParam) || 20;
    return this.prisma.testimonial.findMany({
      where: { isApproved: true },
      include: {
        author: {
          select: { id: true, firstName: true, lastName: true, avatarUrl: true },
        },
      },
      orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
      take: limit,
    });
  }

  async getFeatured(limit = 6) {
    return this.prisma.testimonial.findMany({
      where: { isApproved: true, isFeatured: true },
      include: {
        author: {
          select: { id: true, firstName: true, lastName: true, avatarUrl: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  // ── User ──

  async create(data: {
    authorId: string;
    content: string;
    rating?: number;
    role?: string;
    company?: string;
  }) {
    const user = await this.prisma.user.findUnique({ where: { id: data.authorId } });
    if (!user) throw new NotFoundException('Utilisateur non trouvé');

    return this.prisma.testimonial.create({
      data: {
        authorId: user.id,
        content: data.content,
        rating: data.rating || 5,
        role: data.role,
        company: data.company,
      },
    });
  }

  async getUserTestimonials(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return [];

    return this.prisma.testimonial.findMany({
      where: { authorId: user.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: string, userId: string, data: { content?: string; rating?: number; role?: string; company?: string }) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const testimonial = await this.prisma.testimonial.findUnique({ where: { id } });
    if (!testimonial) throw new NotFoundException('Témoignage non trouvé');
    if (!user || testimonial.authorId !== user.id) throw new ForbiddenException('Non autorisé');

    return this.prisma.testimonial.update({
      where: { id },
      data: { ...data, isApproved: false }, // Reset approval on edit
    });
  }

  async remove(id: string, userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const testimonial = await this.prisma.testimonial.findUnique({ where: { id } });
    if (!testimonial) throw new NotFoundException('Témoignage non trouvé');
    if (!user || (testimonial.authorId !== user.id && user.role !== 'ADMIN')) {
      throw new ForbiddenException('Non autorisé');
    }
    return this.prisma.testimonial.delete({ where: { id } });
  }

  // ── Admin ──

  async getAll(pageParam: any = 1, limitParam: any = 20) {
    const page = Number(pageParam) || 1;
    const limit = Number(limitParam) || 20;
    const [data, total] = await Promise.all([
      this.prisma.testimonial.findMany({
        include: {
          author: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.testimonial.count(),
    ]);
    return { data, total, page, limit };
  }

  async approve(id: string) {
    return this.prisma.testimonial.update({ where: { id }, data: { isApproved: true } });
  }

  async reject(id: string) {
    return this.prisma.testimonial.update({ where: { id }, data: { isApproved: false } });
  }

  async toggleFeatured(id: string) {
    const t = await this.prisma.testimonial.findUnique({ where: { id } });
    if (!t) throw new NotFoundException('Témoignage non trouvé');
    return this.prisma.testimonial.update({
      where: { id },
      data: { isFeatured: !t.isFeatured },
    });
  }
}
