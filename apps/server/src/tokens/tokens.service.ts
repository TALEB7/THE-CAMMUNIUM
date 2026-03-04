import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TokensService {
  private readonly logger = new Logger(TokensService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get Tks balance for user
   */
  async getBalance(clerkId: string) {
    const user = await this.prisma.user.findUnique({
      where: { clerkId },
      include: { tksWallet: true },
    });

    if (!user) throw new NotFoundException('User not found');

    return {
      balance: user.tksWallet?.balance || 0,
      totalEarned: user.tksWallet?.totalEarned || 0,
      totalSpent: user.tksWallet?.totalSpent || 0,
    };
  }

  /**
   * Get transaction history
   */
  async getTransactions(clerkId: string) {
    const user = await this.prisma.user.findUnique({ where: { clerkId } });
    if (!user) throw new NotFoundException('User not found');

    const transactions = await this.prisma.tksTransaction.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return transactions;
  }

  /**
   * Award Tks tokens to a user
   */
  async awardTokens(userId: string, amount: number, reason: string) {
    const wallet = await this.prisma.tksWallet.upsert({
      where: { userId },
      update: {
        balance: { increment: amount },
        totalEarned: { increment: amount },
      },
      create: {
        userId,
        balance: amount,
        totalEarned: amount,
      },
    });

    await this.prisma.tksTransaction.create({
      data: {
        userId,
        amount,
        type: 'EARNED',
        reason,
      },
    });

    this.logger.log(`Awarded ${amount} Tks to user ${userId}: ${reason}`);
    return wallet;
  }

  /**
   * Spend Tks tokens
   */
  async spendTokens(userId: string, amount: number, reason: string) {
    const wallet = await this.prisma.tksWallet.findUnique({ where: { userId } });
    if (!wallet || wallet.balance < amount) {
      throw new BadRequestException('Insufficient Tks balance');
    }

    const updated = await this.prisma.tksWallet.update({
      where: { userId },
      data: {
        balance: { decrement: amount },
        totalSpent: { increment: amount },
      },
    });

    await this.prisma.tksTransaction.create({
      data: {
        userId,
        amount: -amount,
        type: 'SPENT',
        reason,
      },
    });

    this.logger.log(`User ${userId} spent ${amount} Tks: ${reason}`);
    return updated;
  }

  /**
   * Claim daily login reward (+2 Tks)
   */
  async claimDailyReward(clerkId: string) {
    const user = await this.prisma.user.findUnique({ where: { clerkId } });
    if (!user) throw new NotFoundException('User not found');

    // Check if already claimed today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingClaim = await this.prisma.tksTransaction.findFirst({
      where: {
        userId: user.id,
        reason: 'Connexion quotidienne',
        createdAt: { gte: today },
      },
    });

    if (existingClaim) {
      throw new BadRequestException('Récompense quotidienne déjà réclamée aujourd\'hui');
    }

    await this.awardTokens(user.id, 2, 'Connexion quotidienne');
    return { message: 'Récompense de 2 Tks réclamée !', amount: 2 };
  }
}
