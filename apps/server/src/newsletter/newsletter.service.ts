import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NewsletterService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Subscribers ──

  async subscribe(data: { email: string; firstName?: string; lastName?: string; userId?: string }) {
    const existing = await this.prisma.newsletterSubscriber.findUnique({
      where: { email: data.email },
    });

    if (existing) {
      if (existing.status === 'ACTIVE') throw new ConflictException('Déjà inscrit');
      // Re-subscribe
      return this.prisma.newsletterSubscriber.update({
        where: { email: data.email },
        data: { status: 'ACTIVE', unsubscribedAt: null },
      });
    }

    return this.prisma.newsletterSubscriber.create({ data });
  }

  async unsubscribe(email: string) {
    const sub = await this.prisma.newsletterSubscriber.findUnique({ where: { email } });
    if (!sub) throw new NotFoundException('Email non trouvé');

    return this.prisma.newsletterSubscriber.update({
      where: { email },
      data: { status: 'UNSUBSCRIBED', unsubscribedAt: new Date() },
    });
  }

  async getSubscribers(page = 1, limit = 50) {
    const [data, total] = await Promise.all([
      this.prisma.newsletterSubscriber.findMany({
        where: { status: 'ACTIVE' },
        orderBy: { subscribedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.newsletterSubscriber.count({ where: { status: 'ACTIVE' } }),
    ]);
    return { data, total, page, limit };
  }

  async getStats() {
    const [active, unsubscribed, total] = await Promise.all([
      this.prisma.newsletterSubscriber.count({ where: { status: 'ACTIVE' } }),
      this.prisma.newsletterSubscriber.count({ where: { status: 'UNSUBSCRIBED' } }),
      this.prisma.newsletterSubscriber.count(),
    ]);
    return { active, unsubscribed, total };
  }

  // ── Campaigns ──

  async createCampaign(data: { subject: string; content: string; previewText?: string }) {
    return this.prisma.newsletterCampaign.create({ data });
  }

  async getCampaigns(page = 1, limit = 20) {
    const [data, total] = await Promise.all([
      this.prisma.newsletterCampaign.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.newsletterCampaign.count(),
    ]);
    return { data, total, page, limit };
  }

  async getCampaignById(id: string) {
    const campaign = await this.prisma.newsletterCampaign.findUnique({ where: { id } });
    if (!campaign) throw new NotFoundException('Campagne non trouvée');
    return campaign;
  }

  async updateCampaign(id: string, data: any) {
    return this.prisma.newsletterCampaign.update({ where: { id }, data });
  }

  async sendCampaign(id: string) {
    const activeCount = await this.prisma.newsletterSubscriber.count({ where: { status: 'ACTIVE' } });
    return this.prisma.newsletterCampaign.update({
      where: { id },
      data: { status: 'SENT', sentAt: new Date(), recipientCount: activeCount },
    });
  }

  async deleteCampaign(id: string) {
    return this.prisma.newsletterCampaign.delete({ where: { id } });
  }

  // ── Contact Messages ──

  async submitContact(data: { name: string; email: string; subject: string; message: string; userId?: string }) {
    return this.prisma.contactMessage.create({ data });
  }

  async getContactMessages(page = 1, limit = 20, status?: string) {
    const where: any = {};
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.contactMessage.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.contactMessage.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async updateContactStatus(id: string, status: string, replyContent?: string) {
    const data: any = { status };
    if (replyContent) {
      data.replyContent = replyContent;
      data.repliedAt = new Date();
    }
    return this.prisma.contactMessage.update({ where: { id }, data });
  }

  async getContactStats() {
    const [newCount, read, replied, archived, total] = await Promise.all([
      this.prisma.contactMessage.count({ where: { status: 'NEW' } }),
      this.prisma.contactMessage.count({ where: { status: 'READ' } }),
      this.prisma.contactMessage.count({ where: { status: 'REPLIED' } }),
      this.prisma.contactMessage.count({ where: { status: 'ARCHIVED' } }),
      this.prisma.contactMessage.count(),
    ]);
    return { new: newCount, read, replied, archived, total };
  }
}
