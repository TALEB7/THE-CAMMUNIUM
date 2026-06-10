import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';

// Minimum card-detection score (0–100) below which we reject the image
const MIN_CIN_CONFIDENCE = 10;

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  constructor(
    private prisma: PrismaService,
    private aiService: AiService,
  ) {}

  async extractCinAndSyncProfile(userId: string, file: Express.Multer.File) {
    let extraction;
    try {
      extraction = await this.aiService.extractCin(file.buffer);
    } catch (err: any) {
      this.logger.error(`CNIE extraction failed for user ${userId}: ${err?.message}`, err?.stack);
      throw new HttpException(
        'Service d\'extraction indisponible, réessayez plus tard',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    if ((extraction.confidence ?? 0) < MIN_CIN_CONFIDENCE) {
      throw new BadRequestException(
        'Carte non détectée. Vérifiez la qualité de la photo (bonne lumière, carte bien visible).',
      );
    }

    await this.prisma.personalProfile.upsert({
      where: { userId },
      update: {
        firstName: extraction.given_name ?? undefined,
        lastName: extraction.surname ?? undefined,
        birthday: extraction.birth_date ?? undefined,
        identityType: 'cin',
        identityNumber: extraction.card_number ?? undefined,
        address: extraction.address ?? undefined,
        country: extraction.nationality ?? undefined,
      },
      create: {
        userId,
        firstName: extraction.given_name ?? undefined,
        lastName: extraction.surname ?? undefined,
        birthday: extraction.birth_date ?? undefined,
        identityType: 'cin',
        identityNumber: extraction.card_number ?? undefined,
        address: extraction.address ?? undefined,
        country: extraction.nationality ?? undefined,
        interests: [],
      },
    });

    return extraction;
  }

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
  async getPendingDocuments(pageParam: any = 1, limitParam: any = 20) {
    const page = Number(pageParam) || 1;
    const limit = Number(limitParam) || 20;
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
