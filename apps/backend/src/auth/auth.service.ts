import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { OnboardingDto } from './dto/onboarding.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) { }

  /**
   * Register a new local user with email and password
   */
  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new BadRequestException('Cet email est déjà utilisé');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        accountType: dto.accountType || 'personal',
        phone: dto.phone,
      },
    });

    const token = this.jwtService.sign({ sub: user.id, email: user.email, role: user.role });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        accountType: user.accountType,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        role: user.role,
      },
      token,
    };
  }

  /**
   * Login existing user
   */
  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);

    if (!isMatch) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    const token = this.jwtService.sign({ sub: user.id, email: user.email, role: user.role });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        accountType: user.accountType,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        role: user.role,
      },
      token,
    };
  }

  /**
   * Complete onboarding — set account type and detailed profile info
   */
  async onboardUser(dto: OnboardingDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new BadRequestException('Utilisateur non trouvé');
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Update basic user info
      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: {
          accountType: dto.accountType,
          firstName: dto.firstName || user.firstName,
          lastName: dto.lastName || user.lastName,
          avatarUrl: dto.avatarUrl || user.avatarUrl,
          phone: dto.phone || user.phone,
        },
      });

      // 2. Populate specific profiles
      if (dto.accountType === 'personal') {
        await tx.personalProfile.upsert({
          where: { userId: user.id },
          update: {
            firstName: dto.firstName || user.firstName,
            lastName: dto.lastName || user.lastName,
            birthday: dto.birthday,
            identityType: dto.identityType,
            identityNumber: dto.identityNumber,
            phone: dto.phone || user.phone,
            email: dto.email,
            country: dto.country,
            city: dto.city,
            address: dto.address,
            photoUrl: dto.avatarUrl || user.avatarUrl,
          },
          create: {
            userId: user.id,
            firstName: dto.firstName || user.firstName,
            lastName: dto.lastName || user.lastName,
            birthday: dto.birthday,
            identityType: dto.identityType,
            identityNumber: dto.identityNumber,
            phone: dto.phone || user.phone,
            email: dto.email,
            country: dto.country,
            city: dto.city,
            address: dto.address,
            photoUrl: dto.avatarUrl || user.avatarUrl,
          },
        });
      } else if (dto.accountType === 'business' || dto.accountType === 'company_creation') {
        await tx.businessProfile.upsert({
          where: { userId: user.id },
          update: {
            companyName: dto.companyName,
            rc: dto.rc,
            creationDate: dto.creationDate,
            phone: dto.phone || user.phone,
            email: dto.companyEmail || dto.email,
            country: dto.country || 'Maroc',
            city: dto.city,
            address: dto.address,
            role: dto.role,
            personInCharge: dto.personInCharge,
            interests: dto.interests || [],
            logoUrl: dto.avatarUrl || user.avatarUrl,
          },
          create: {
            userId: user.id,
            companyName: dto.companyName,
            rc: dto.rc,
            creationDate: dto.creationDate,
            phone: dto.phone || user.phone,
            email: dto.companyEmail || dto.email,
            country: dto.country || 'Maroc',
            city: dto.city,
            address: dto.address,
            role: dto.role,
            personInCharge: dto.personInCharge,
            interests: dto.interests || [],
            logoUrl: dto.avatarUrl || user.avatarUrl,
          },
        });

        // Create the KYB (Know-Your-Business) verification record
        await tx.kyc.upsert({
          where: { userId: user.id },
          update: {
            type: 'business',
            status: 'pending',
            representativeName: dto.personInCharge,
          },
          create: {
            userId: user.id,
            type: 'business',
            status: 'pending',
            representativeName: dto.personInCharge,
          },
        });
      }

      // 3. Handle Membership/Plan
      if (dto.selectedPlan && !dto.selectedPlan.includes('_free')) {
        await tx.membership.upsert({
          where: { userId: user.id },
          update: {
            plan: dto.selectedPlan,
            status: 'ACTIVE',
            expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
          },
          create: {
            userId: user.id,
            plan: dto.selectedPlan,
            status: 'ACTIVE',
            expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          },
        });
      }

      // 4. Award initial tokens
      await this.awardInitialTokens(tx, user.id, dto.accountType);

      return updatedUser;
    });
  }

  /**
   * Award initial Tks tokens based on account type
   */
  private async awardInitialTokens(tx: Prisma.TransactionClient, userId: string, accountType: string) {
    const tokenAmounts: Record<string, number> = {
      personal: 50,
      business: 150,
      company_creation: 500,
    };

    const amount = tokenAmounts[accountType] || 0;
    if (amount === 0) return;

    // Upsert token wallet
    await tx.tksWallet.upsert({
      where: { userId },
      update: {
        balance: { increment: amount },
      },
      create: {
        userId,
        balance: amount,
      },
    });

    // Record transaction
    await tx.tksTransaction.create({
      data: {
        userId,
        amount,
        type: 'EARNED',
        reason: `Bonus d'inscription ${accountType}`,
      },
    });
  }
}
