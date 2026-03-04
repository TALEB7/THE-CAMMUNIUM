import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Webhook } from 'svix';
import { PrismaService } from '../prisma/prisma.service';
import { OnboardingDto } from './dto/onboarding.dto';

interface ClerkWebhookEvent {
  type: string;
  data: {
    id: string;
    email_addresses: Array<{ email_address: string; id: string }>;
    first_name: string | null;
    last_name: string | null;
    image_url: string | null;
    created_at: number;
    updated_at: number;
  };
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Verify and process Clerk webhook events
   */
  async handleClerkWebhook(
    rawBody: Buffer,
    headers: Record<string, string>,
  ) {
    const webhookSecret = this.config.get<string>('CLERK_WEBHOOK_SECRET');
    if (!webhookSecret) {
      throw new BadRequestException('Webhook secret not configured');
    }

    const wh = new Webhook(webhookSecret);
    let event: ClerkWebhookEvent;

    try {
      event = wh.verify(rawBody.toString(), headers) as ClerkWebhookEvent;
    } catch (err) {
      this.logger.error('Clerk webhook verification failed', err);
      throw new BadRequestException('Invalid webhook signature');
    }

    this.logger.log(`Clerk webhook received: ${event.type}`);

    switch (event.type) {
      case 'user.created':
        await this.handleUserCreated(event.data);
        break;
      case 'user.updated':
        await this.handleUserUpdated(event.data);
        break;
      case 'user.deleted':
        await this.handleUserDeleted(event.data.id);
        break;
      default:
        this.logger.log(`Unhandled webhook event: ${event.type}`);
    }

    return { received: true };
  }

  /**
   * Handle user creation from Clerk
   */
  private async handleUserCreated(data: ClerkWebhookEvent['data']) {
    const email = data.email_addresses[0]?.email_address;

    const user = await this.prisma.user.upsert({
      where: { clerkId: data.id },
      update: {
        email,
        firstName: data.first_name,
        lastName: data.last_name,
        avatarUrl: data.image_url,
      },
      create: {
        clerkId: data.id,
        email,
        firstName: data.first_name,
        lastName: data.last_name,
        avatarUrl: data.image_url,
      },
    });

    this.logger.log(`User synced from Clerk: ${user.id} (${email})`);
    return user;
  }

  /**
   * Handle user update from Clerk
   */
  private async handleUserUpdated(data: ClerkWebhookEvent['data']) {
    const email = data.email_addresses[0]?.email_address;

    await this.prisma.user.update({
      where: { clerkId: data.id },
      data: {
        email,
        firstName: data.first_name,
        lastName: data.last_name,
        avatarUrl: data.image_url,
      },
    });
  }

  /**
   * Handle user deletion from Clerk
   */
  private async handleUserDeleted(clerkId: string) {
    await this.prisma.user.update({
      where: { clerkId },
      data: { isActive: false },
    });
  }

  /**
   * Complete onboarding — set account type and initial Tks
   */
  async onboardUser(dto: OnboardingDto) {
    // First try by clerkId
    let user = await this.prisma.user.findUnique({
      where: { clerkId: dto.clerkId },
    });

    // Fallback: check by email (handles demo mode & re-onboarding)
    if (!user && dto.email) {
      user = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });
    }

    if (!user) {
      // Create user if neither clerkId nor email found
      const newUser = await this.prisma.user.create({
        data: {
          clerkId: dto.clerkId,
          email: dto.email,
          firstName: dto.firstName,
          lastName: dto.lastName,
          accountType: dto.accountType,
        },
      });

      // Award initial Tks based on account type
      await this.awardInitialTokens(newUser.id, dto.accountType);
      return newUser;
    }

    // Update existing user with account type (and clerkId if changed)
    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        accountType: dto.accountType,
        clerkId: dto.clerkId,
        firstName: dto.firstName || user.firstName,
        lastName: dto.lastName || user.lastName,
      },
    });

    await this.awardInitialTokens(user.id, dto.accountType);
    return updatedUser;
  }

  /**
   * Award initial Tks tokens based on account type
   */
  private async awardInitialTokens(userId: string, accountType: string) {
    const tokenAmounts: Record<string, number> = {
      personal: 50,
      business: 150,
      company_creation: 500,
    };

    const amount = tokenAmounts[accountType] || 0;
    if (amount === 0) return;

    // Upsert token wallet
    await this.prisma.tksWallet.upsert({
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
    await this.prisma.tksTransaction.create({
      data: {
        userId,
        amount,
        type: 'EARNED',
        reason: `Bonus d'inscription ${accountType}`,
      },
    });
  }
}
