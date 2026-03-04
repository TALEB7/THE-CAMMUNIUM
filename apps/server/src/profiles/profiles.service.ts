import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdatePersonalProfileDto } from './dto/update-personal-profile.dto';
import { UpdateBusinessProfileDto } from './dto/update-business-profile.dto';

@Injectable()
export class ProfilesService {
  private readonly logger = new Logger(ProfilesService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get full profile by Clerk ID (for the logged-in user)
   */
  async getProfileByClerkId(clerkId: string) {
    const user = await this.prisma.user.findUnique({
      where: { clerkId },
      include: {
        personalProfile: true,
        businessProfile: true,
        tksWallet: true,
        membership: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const profile = user.accountType === 'business' ? user.businessProfile : user.personalProfile;

    return {
      id: user.id,
      clerkId: user.clerkId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.avatarUrl,
      accountType: user.accountType,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
      tksBalance: user.tksWallet?.balance || 0,
      membershipPlan: user.membership?.plan || null,
      membershipExpiresAt: user.membership?.expiresAt || null,
      ...this.flattenProfile(profile),
    };
  }

  /**
   * Update personal profile
   */
  async updatePersonalProfile(clerkId: string, dto: UpdatePersonalProfileDto) {
    const user = await this.prisma.user.findUnique({ where: { clerkId } });
    if (!user) throw new NotFoundException('User not found');

    const { workHistory, interests, accountType, ...profileData } = dto;

    // Upsert personal profile
    const profile = await this.prisma.personalProfile.upsert({
      where: { userId: user.id },
      update: {
        ...profileData,
        workHistory: workHistory ? JSON.parse(JSON.stringify(workHistory)) : undefined,
        interests: interests || [],
      },
      create: {
        userId: user.id,
        ...profileData,
        workHistory: workHistory ? JSON.parse(JSON.stringify(workHistory)) : [],
        interests: interests || [],
      },
    });

    // Update user's account type
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        accountType: 'personal',
      },
    });

    this.logger.log(`Personal profile updated for user ${user.id}`);
    return profile;
  }

  /**
   * Update business profile
   */
  async updateBusinessProfile(clerkId: string, dto: UpdateBusinessProfileDto) {
    const user = await this.prisma.user.findUnique({ where: { clerkId } });
    if (!user) throw new NotFoundException('User not found');

    const { interests, accountType, ...profileData } = dto;

    const profile = await this.prisma.businessProfile.upsert({
      where: { userId: user.id },
      update: {
        ...profileData,
        interests: interests || [],
      },
      create: {
        userId: user.id,
        ...profileData,
        interests: interests || [],
      },
    });

    // Update user's account type
    await this.prisma.user.update({
      where: { id: user.id },
      data: { accountType: 'business' },
    });

    this.logger.log(`Business profile updated for user ${user.id}`);
    return profile;
  }

  /**
   * Get public profile (limited info for non-authenticated viewing)
   */
  async getPublicProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        personalProfile: true,
        businessProfile: true,
      },
    });

    if (!user || !user.isActive) {
      throw new NotFoundException('Profile not found');
    }

    // Increment profile views
    await this.prisma.user.update({
      where: { id: userId },
      data: { profileViews: { increment: 1 } },
    });

    const profile = user.accountType === 'business' ? user.businessProfile : user.personalProfile;

    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.avatarUrl,
      accountType: user.accountType,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
      ...this.flattenProfile(profile),
    };
  }

  /**
   * Search profiles
   */
  async searchProfiles(filters: {
    query?: string;
    city?: string;
    profession?: string;
    type?: string;
    page: number;
    limit: number;
  }) {
    const { query, city, profession, type, page, limit } = filters;
    const skip = (page - 1) * limit;

    const where: any = { isActive: true };

    if (type) {
      where.accountType = type;
    }

    if (query) {
      where.OR = [
        { firstName: { contains: query, mode: 'insensitive' } },
        { lastName: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include: {
          personalProfile: true,
          businessProfile: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users.map((user) => ({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        avatarUrl: user.avatarUrl,
        accountType: user.accountType,
        isVerified: user.isVerified,
        profession: user.personalProfile?.profession || user.businessProfile?.activities,
        city: user.personalProfile?.city || user.businessProfile?.city,
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Flatten a profile object (personal or business) for response
   */
  private flattenProfile(profile: any) {
    if (!profile) return {};
    const { id, userId, createdAt, updatedAt, ...rest } = profile;
    return rest;
  }
}
