import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ComparisonsService {
  constructor(private prisma: PrismaService) {}

  // Create a new comparison list
  async createList(userId: string, name: string) {
    return this.prisma.comparisonList.create({
      data: { userId, name },
      include: { items: { include: { listing: true } } },
    });
  }

  // Get all comparison lists for a user
  async getUserLists(userId: string) {
    return this.prisma.comparisonList.findMany({
      where: { userId },
      include: {
        items: {
          include: {
            listing: {
              include: { category: true, seller: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  // Get one comparison list
  async getList(id: string, userId: string) {
    const list = await this.prisma.comparisonList.findFirst({
      where: { id, userId },
      include: {
        items: {
          include: {
            listing: {
              include: {
                category: true,
                seller: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
              },
            },
          },
        },
      },
    });
    if (!list) throw new NotFoundException('Liste de comparaison non trouvée');
    return list;
  }

  // Add a listing to a comparison list (max 5 items)
  async addItem(listId: string, userId: string, listingId: string) {
    const list = await this.prisma.comparisonList.findFirst({
      where: { id: listId, userId },
      include: { items: true },
    });
    if (!list) throw new NotFoundException('Liste de comparaison non trouvée');
    if (list.items.length >= 5) {
      throw new BadRequestException('Vous ne pouvez comparer que 5 articles maximum');
    }
    const exists = list.items.find((i) => i.listingId === listingId);
    if (exists) {
      throw new BadRequestException('Cet article est déjà dans la liste');
    }

    await this.prisma.comparisonItem.create({ data: { comparisonListId: listId, listingId } });

    return this.getList(listId, userId);
  }

  // Remove an item from the list
  async removeItem(listId: string, userId: string, itemId: string) {
    const list = await this.prisma.comparisonList.findFirst({ where: { id: listId, userId } });
    if (!list) throw new NotFoundException('Liste de comparaison non trouvée');

    await this.prisma.comparisonItem.delete({ where: { id: itemId } });
    return this.getList(listId, userId);
  }

  // Delete an entire comparison list
  async deleteList(id: string, userId: string) {
    const list = await this.prisma.comparisonList.findFirst({ where: { id, userId } });
    if (!list) throw new NotFoundException('Liste non trouvée');

    await this.prisma.comparisonItem.deleteMany({ where: { comparisonListId: id } });
    return this.prisma.comparisonList.delete({ where: { id } });
  }

  // Rename a comparison list
  async renameList(id: string, userId: string, name: string) {
    const list = await this.prisma.comparisonList.findFirst({ where: { id, userId } });
    if (!list) throw new NotFoundException('Liste non trouvée');

    return this.prisma.comparisonList.update({
      where: { id },
      data: { name },
    });
  }
}
