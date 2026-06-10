import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class KycService {
  private readonly logger = new Logger(KycService.name);
  private readonly uploadDir: string;

  constructor(private readonly prisma: PrismaService) {
    this.uploadDir = path.join(process.cwd(), 'uploads', 'kyc');
    this.ensureKycUploadDir();
  }

  private ensureKycUploadDir() {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
      this.logger.log(`Created KYC upload base directory: ${this.uploadDir}`);
    }
  }

  async getKycStatus(userId: string) {
    const kyc = await this.prisma.kyc.findUnique({
      where: { userId },
    });
    if (!kyc) return { status: 'none' };
    return {
      status: kyc.status,
      type: kyc.type,
      submittedAt: kyc.submittedAt,
    };
  }

  async submitPersonalKyc(
    userId: string,
    files: {
      cinFront?: Express.Multer.File[];
      cinBack?: Express.Multer.File[];
      selfie?: Express.Multer.File[];
    },
    metadata: any,
  ) {
    const userDir = path.join(this.uploadDir, userId);
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }

    const saved: Record<string, string> = {};

    const fileFields = ['cinFront', 'cinBack', 'selfie'];
    for (const field of fileFields) {
      const fieldFiles = files[field as keyof typeof files];
      if (fieldFiles && fieldFiles.length > 0) {
        const file = fieldFiles[0];
        const filename = `${Date.now()}-${file.originalname}`;
        const dest = path.join(userDir, filename);
        
        fs.writeFileSync(dest, file.buffer);
        // Store relative path (like uploads/kyc/userId/filename) to match Next.js pattern
        saved[field] = path.relative(process.cwd(), dest).replace(/\\/g, '/');
      }
    }

    // Upsert KYC record
    return this.prisma.kyc.upsert({
      where: { userId },
      update: {
        type: 'personal',
        status: 'pending',
        submittedAt: new Date(),
        cinFrontUrl: saved.cinFront,
        cinBackUrl: saved.cinBack,
        selfieUrl: saved.selfie,
        metadata: metadata || {},
      },
      create: {
        userId,
        type: 'personal',
        status: 'pending',
        submittedAt: new Date(),
        cinFrontUrl: saved.cinFront,
        cinBackUrl: saved.cinBack,
        selfieUrl: saved.selfie,
        metadata: metadata || {},
      },
    });
  }

  async submitBusinessKyc(
    userId: string,
    files: {
      rc?: Express.Multer.File[];
      statuts?: Express.Multer.File[];
      representativeId?: Express.Multer.File[];
      taxCert?: Express.Multer.File[];
    },
    metadata: any,
  ) {
    const userDir = path.join(this.uploadDir, userId);
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }

    const saved: Record<string, string> = {};

    const fileFields = ['rc', 'statuts', 'representativeId', 'taxCert'];
    for (const field of fileFields) {
      const fieldFiles = files[field as keyof typeof files];
      if (fieldFiles && fieldFiles.length > 0) {
        const file = fieldFiles[0];
        const filename = `${Date.now()}-${file.originalname}`;
        const dest = path.join(userDir, filename);

        fs.writeFileSync(dest, file.buffer);
        saved[field] = path.relative(process.cwd(), dest).replace(/\\/g, '/');
      }
    }

    return this.prisma.kyc.upsert({
      where: { userId },
      update: {
        type: 'business',
        status: 'pending',
        submittedAt: new Date(),
        reviewedAt: null,
        rcUrl: saved.rc,
        statutsUrl: saved.statuts,
        representativeIdUrl: saved.representativeId,
        taxCertUrl: saved.taxCert,
        representativeName: metadata?.representativeName,
        metadata: metadata || {},
      },
      create: {
        userId,
        type: 'business',
        status: 'pending',
        submittedAt: new Date(),
        rcUrl: saved.rc,
        statutsUrl: saved.statuts,
        representativeIdUrl: saved.representativeId,
        taxCertUrl: saved.taxCert,
        representativeName: metadata?.representativeName,
        metadata: metadata || {},
      },
    });
  }

  /**
   * Admin: list pending KYB (business) verification requests
   */
  async getPendingBusinessKyc(page = 1, limit = 20) {
    const skip = (Math.max(page, 1) - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.kyc.findMany({
        where: { type: 'business', status: 'pending' },
        orderBy: { submittedAt: 'asc' },
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              businessProfile: true,
            },
          },
        },
      }),
      this.prisma.kyc.count({ where: { type: 'business', status: 'pending' } }),
    ]);

    return { items, total, page, limit };
  }

  /**
   * Admin: approve or reject a business KYC submission
   */
  async reviewBusinessKyc(id: string, status: 'approved' | 'rejected', rejectionReason?: string) {
    const kyc = await this.prisma.kyc.findUnique({ where: { id } });
    if (!kyc) {
      throw new NotFoundException('Dossier KYB introuvable');
    }

    return this.prisma.kyc.update({
      where: { id },
      data: {
        status,
        reviewedAt: new Date(),
        metadata: {
          ...(typeof kyc.metadata === 'object' && kyc.metadata ? kyc.metadata : {}),
          ...(rejectionReason ? { rejectionReason } : {}),
        },
      },
    });
  }
}
