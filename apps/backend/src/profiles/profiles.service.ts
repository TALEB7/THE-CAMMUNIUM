import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdatePersonalProfileDto } from './dto/update-personal-profile.dto';
import { UpdateBusinessProfileDto } from './dto/update-business-profile.dto';

@Injectable()
export class ProfilesService {
  private readonly logger = new Logger(ProfilesService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get full profile by database User ID
   */
  async getProfileByUserId(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
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

    const profile = (user.accountType === 'business' || user.accountType === 'company_creation') ? user.businessProfile : user.personalProfile;

    return {
      id: user.id,
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
  async updatePersonalProfile(userId: string, dto: UpdatePersonalProfileDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const {
      workHistory,
      interests,
      accountType,
      avatarUrl,
      education,
      softSkills,
      languages,
      ...profileData
    } = dto;

    // Only include defined fields (partial update)
    const updateData: any = {};
    Object.entries(profileData).forEach(([k, v]) => { if (v !== undefined) updateData[k] = v; });
    if (workHistory !== undefined) updateData.workHistory = JSON.parse(JSON.stringify(workHistory));
    if (interests !== undefined) updateData.interests = interests;
    if (education !== undefined) updateData.education = JSON.parse(JSON.stringify(education));
    if (softSkills !== undefined) updateData.softSkills = JSON.parse(JSON.stringify(softSkills));
    if (languages !== undefined) updateData.languages = JSON.parse(JSON.stringify(languages));

    const profile = await this.prisma.personalProfile.upsert({
      where: { userId: user.id },
      update: updateData,
      create: { userId: user.id, ...updateData },
    });

    // Update user table only for provided fields
    const userUpdate: any = { accountType: 'personal' };
    if (dto.firstName) userUpdate.firstName = dto.firstName;
    if (dto.lastName) userUpdate.lastName = dto.lastName;
    if (avatarUrl) userUpdate.avatarUrl = avatarUrl;

    await this.prisma.user.update({ where: { id: user.id }, data: userUpdate });

    this.logger.log(`Personal profile updated for user ${user.id}`);
    return profile;
  }

  /**
   * Update business profile
   */
  async updateBusinessProfile(userId: string, dto: UpdateBusinessProfileDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const {
      interests,
      accountType,
      avatarUrl,
      technicalEquipment,
      humanResources,
      events,
      onlineMeetings,
      trainingPrograms,
      ...profileData
    } = dto;

    const updateData: any = {};
    Object.entries(profileData).forEach(([k, v]) => { if (v !== undefined) updateData[k] = v; });
    if (interests !== undefined) updateData.interests = interests;
    if (technicalEquipment !== undefined) updateData.technicalEquipment = JSON.parse(JSON.stringify(technicalEquipment));
    if (humanResources !== undefined) updateData.humanResources = JSON.parse(JSON.stringify(humanResources));
    if (events !== undefined) updateData.events = JSON.parse(JSON.stringify(events));
    if (onlineMeetings !== undefined) updateData.onlineMeetings = JSON.parse(JSON.stringify(onlineMeetings));
    if (trainingPrograms !== undefined) updateData.trainingPrograms = JSON.parse(JSON.stringify(trainingPrograms));

    const profile = await this.prisma.businessProfile.upsert({
      where: { userId: user.id },
      update: updateData,
      create: { userId: user.id, ...updateData },
    });

    const userUpdate: any = { accountType: 'business' };
    if (avatarUrl) userUpdate.avatarUrl = avatarUrl;

    await this.prisma.user.update({ where: { id: user.id }, data: userUpdate });

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

    const profile = (user.accountType === 'business' || user.accountType === 'company_creation') ? user.businessProfile : user.personalProfile;

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
    const andConditions: any[] = [];

    if (type) {
      where.accountType = type;
    }

    if (query) {
      andConditions.push({
        OR: [
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
        ],
      });
    }

    if (city) {
      andConditions.push({
        OR: [
          { personalProfile: { is: { city: { contains: city, mode: 'insensitive' } } } },
          { businessProfile: { is: { city: { contains: city, mode: 'insensitive' } } } },
        ],
      });
    }

    if (profession) {
      andConditions.push({
        personalProfile: { is: { profession: { contains: profession, mode: 'insensitive' } } },
      });
    }

    if (andConditions.length > 0) {
      where.AND = andConditions;
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
      data: users.map((user: any) => ({
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
