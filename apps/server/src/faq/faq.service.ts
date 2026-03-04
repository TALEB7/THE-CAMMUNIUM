import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FaqService {
  constructor(private prisma: PrismaService) {}

  // ── Categories ──

  async getCategories() {
    return this.prisma.faqCategory.findMany({
      where: { isActive: true },
      include: { _count: { select: { items: true } } },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async createCategory(data: { name: string; slug: string; description?: string; icon?: string }) {
    return this.prisma.faqCategory.create({ data });
  }

  async updateCategory(id: string, data: Partial<{ name: string; description: string; icon: string; sortOrder: number; isActive: boolean }>) {
    return this.prisma.faqCategory.update({ where: { id }, data });
  }

  async deleteCategory(id: string) {
    return this.prisma.faqCategory.delete({ where: { id } });
  }

  // ── FAQ Items ──

  async getItemsByCategory(categoryId: string) {
    return this.prisma.faqItem.findMany({
      where: { categoryId, isPublished: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async getItemBySlug(slug: string) {
    const item = await this.prisma.faqItem.findUnique({ where: { slug } });
    if (item) {
      await this.prisma.faqItem.update({
        where: { id: item.id },
        data: { viewCount: { increment: 1 } },
      });
    }
    return item;
  }

  async createItem(data: {
    categoryId: string;
    question: string;
    answer: string;
    slug: string;
    tags?: string[];
  }) {
    return this.prisma.faqItem.create({ data });
  }

  async updateItem(id: string, data: Partial<{
    question: string;
    answer: string;
    sortOrder: number;
    isPublished: boolean;
    tags: string[];
  }>) {
    return this.prisma.faqItem.update({ where: { id }, data });
  }

  async deleteItem(id: string) {
    return this.prisma.faqItem.delete({ where: { id } });
  }

  // ── Helpful vote ──

  async voteHelpful(id: string, helpful: boolean) {
    return this.prisma.faqItem.update({
      where: { id },
      data: helpful
        ? { helpfulYes: { increment: 1 } }
        : { helpfulNo: { increment: 1 } },
    });
  }

  // ── Search FAQ ──

  async search(query: string) {
    return this.prisma.faqItem.findMany({
      where: {
        isPublished: true,
        OR: [
          { question: { contains: query, mode: 'insensitive' } },
          { answer: { contains: query, mode: 'insensitive' } },
          { tags: { hasSome: [query] } },
        ],
      },
      include: { category: { select: { name: true, slug: true } } },
      orderBy: { viewCount: 'desc' },
      take: 20,
    });
  }

  // ── Popular FAQs ──

  async getPopular(limit = 10) {
    return this.prisma.faqItem.findMany({
      where: { isPublished: true },
      include: { category: { select: { name: true, slug: true } } },
      orderBy: { viewCount: 'desc' },
      take: limit,
    });
  }
}
