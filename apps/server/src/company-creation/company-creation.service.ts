import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CompanyCreationService {
  constructor(private prisma: PrismaService) {}

  // Get or create company creation for user
  async getOrCreate(userId: string) {
    let company = await this.prisma.companyCreation.findUnique({
      where: { userId },
      include: { documents: true },
    });

    if (!company) {
      company = await this.prisma.companyCreation.create({
        data: { userId },
        include: { documents: true },
      });
    }

    return company;
  }

  // Get company creation status
  async getStatus(userId: string) {
    const company = await this.prisma.companyCreation.findUnique({
      where: { userId },
      include: {
        documents: {
          select: { id: true, type: true, name: true, status: true, createdAt: true },
        },
      },
    });
    if (!company) throw new NotFoundException('Aucun dossier de création trouvé');
    return company;
  }

  // Update step 1: Legal Form
  async updateStep1(userId: string, data: {
    legalForm: string;
    companyName: string;
    tradeName?: string;
    businessSector?: string;
  }) {
    return this.prisma.companyCreation.upsert({
      where: { userId },
      create: {
        userId,
        currentStep: 1,
        status: 'STEP_1',
        ...data,
      },
      update: {
        currentStep: Math.max(1, (await this.getCurrentStep(userId))),
        status: 'STEP_1',
        ...data,
      },
      include: { documents: true },
    });
  }

  // Update step 2: RC & Tax Registration
  async updateStep2(userId: string, data: {
    rcNumber?: string;
    iceNumber?: string;
    ifNumber?: string;
    cnssNumber?: string;
    taxRegime?: string;
  }) {
    await this.ensureMinStep(userId, 1);
    return this.prisma.companyCreation.update({
      where: { userId },
      data: {
        currentStep: 2,
        status: 'STEP_2',
        ...data,
      },
      include: { documents: true },
    });
  }

  // Update step 3: Bank & Capital
  async updateStep3(userId: string, data: {
    bankName?: string;
    bankAgency?: string;
    accountNumber?: string;
    capital?: number;
    capitalCurrency?: string;
  }) {
    await this.ensureMinStep(userId, 2);
    return this.prisma.companyCreation.update({
      where: { userId },
      data: {
        currentStep: 3,
        status: 'STEP_3',
        ...data,
      },
      include: { documents: true },
    });
  }

  // Update step 4: Address & Contact
  async updateStep4(userId: string, data: {
    legalAddress?: string;
    city?: string;
    postalCode?: string;
    phone?: string;
    email?: string;
    website?: string;
  }) {
    await this.ensureMinStep(userId, 3);
    return this.prisma.companyCreation.update({
      where: { userId },
      data: {
        currentStep: 4,
        status: 'STEP_4',
        ...data,
      },
      include: { documents: true },
    });
  }

  // Submit for review
  async submit(userId: string) {
    const company = await this.prisma.companyCreation.findUnique({ where: { userId } });
    if (!company) throw new NotFoundException('Dossier non trouvé');
    if (company.currentStep < 4) {
      throw new BadRequestException('Veuillez compléter toutes les étapes avant de soumettre');
    }
    if (company.status === 'SUBMITTED' || company.status === 'UNDER_REVIEW') {
      throw new BadRequestException('Le dossier est déjà soumis');
    }

    return this.prisma.companyCreation.update({
      where: { userId },
      data: {
        status: 'SUBMITTED',
        submittedAt: new Date(),
      },
      include: { documents: true },
    });
  }

  // Admin: Review company creation
  async review(companyId: string, adminId: string, decision: {
    approved: boolean;
    notes?: string;
    rejectionReason?: string;
  }) {
    const data: any = {
      reviewedBy: adminId,
      reviewedAt: new Date(),
      reviewNotes: decision.notes,
    };

    if (decision.approved) {
      data.status = 'APPROVED';
      data.approvedAt = new Date();
    } else {
      data.status = 'REJECTED';
      data.rejectedAt = new Date();
      data.rejectionReason = decision.rejectionReason;
    }

    return this.prisma.companyCreation.update({
      where: { id: companyId },
      data,
      include: { documents: true, user: { select: { id: true, firstName: true, lastName: true, email: true } } },
    });
  }

  // Admin: Get all submissions
  async getAllSubmissions(filters: { status?: string; page?: number; limit?: number }) {
    const { page = 1, limit = 20 } = filters;
    const where: any = {};
    if (filters.status) where.status = filters.status;

    const [items, total] = await Promise.all([
      this.prisma.companyCreation.findMany({
        where,
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true } },
          documents: { select: { id: true, type: true, name: true, status: true } },
        },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.companyCreation.count({ where }),
    ]);

    return { submissions: items, total, page, totalPages: Math.ceil(total / limit) };
  }

  // Helpers
  private async getCurrentStep(userId: string): Promise<number> {
    const c = await this.prisma.companyCreation.findUnique({ where: { userId }, select: { currentStep: true } });
    return c?.currentStep || 0;
  }

  private async ensureMinStep(userId: string, minStep: number) {
    const step = await this.getCurrentStep(userId);
    if (step < minStep) {
      throw new BadRequestException(`Veuillez d'abord compléter l'étape ${minStep}`);
    }
  }
}
