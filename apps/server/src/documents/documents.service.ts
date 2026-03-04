import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DocumentsService {
  constructor(private prisma: PrismaService) {}

  async uploadDocument(data: {
    userId: string;
    companyCreationId?: string;
    type: string;
    name: string;
    fileUrl: string;
    fileSize?: number;
    mimeType?: string;
    expiresAt?: string;
  }) {
    return this.prisma.document.create({
      data: {
        userId: data.userId,
        companyCreationId: data.companyCreationId,
        type: data.type,
        name: data.name,
        fileUrl: data.fileUrl,
        fileSize: data.fileSize,
        mimeType: data.mimeType,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
      },
    });
  }

  async getUserDocuments(userId: string, type?: string) {
    const where: any = { userId };
    if (type) where.type = type;

    return this.prisma.document.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getDocument(id: string) {
    const doc = await this.prisma.document.findUnique({ where: { id } });
    if (!doc) throw new NotFoundException('Document non trouvé');
    return doc;
  }

  async deleteDocument(id: string, userId: string) {
    const doc = await this.prisma.document.findFirst({ where: { id, userId } });
    if (!doc) throw new NotFoundException('Document non trouvé');
    return this.prisma.document.delete({ where: { id } });
  }

  // Admin: Verify or reject document
  async verifyDocument(id: string, adminId: string, data: { status: 'VERIFIED' | 'REJECTED'; rejectionReason?: string }) {
    const doc = await this.prisma.document.findUnique({ where: { id } });
    if (!doc) throw new NotFoundException('Document non trouvé');

    return this.prisma.document.update({
      where: { id },
      data: {
        status: data.status,
        verifiedBy: adminId,
        verifiedAt: new Date(),
        rejectionReason: data.rejectionReason,
      },
    });
  }

  // Admin: Get all pending documents
  async getPendingDocuments(page = 1, limit = 20) {
    const [items, total] = await Promise.all([
      this.prisma.document.findMany({
        where: { status: 'PENDING' },
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
        orderBy: { createdAt: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.document.count({ where: { status: 'PENDING' } }),
    ]);

    return { documents: items, total, page, totalPages: Math.ceil(total / limit) };
  }
}
