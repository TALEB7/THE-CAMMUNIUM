import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PollsService {
  constructor(private prisma: PrismaService) {}

  // ── Create Poll ──

  async createPoll(data: {
    authorId: string;
    question: string;
    description?: string;
    context?: string;
    contextId?: string;
    isMultiple?: boolean;
    isAnonymous?: boolean;
    endsAt?: string;
    options: string[];
  }) {
    return this.prisma.poll.create({
      data: {
        authorId: data.authorId,
        question: data.question,
        description: data.description,
        context: data.context,
        contextId: data.contextId,
        isMultiple: data.isMultiple || false,
        isAnonymous: data.isAnonymous || false,
        endsAt: data.endsAt ? new Date(data.endsAt) : null,
        options: {
          create: data.options.map((text, i) => ({ text, sortOrder: i })),
        },
      },
      include: { options: { orderBy: { sortOrder: 'asc' } } },
    });
  }

  // ── Browse Polls ──

  async getPolls(params?: { context?: string; status?: string; page?: number; limit?: number }) {
    const page = params?.page || 1;
    const limit = params?.limit || 20;

    const where: any = {};
    if (params?.context) where.context = params.context;
    if (params?.status) where.status = params.status;
    else where.status = 'ACTIVE';

    const [polls, total] = await Promise.all([
      this.prisma.poll.findMany({
        where,
        include: {
          options: { orderBy: { sortOrder: 'asc' }, include: { _count: { select: { votes: true } } } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.poll.count({ where }),
    ]);

    return { polls, total, page, totalPages: Math.ceil(total / limit) };
  }

  async getPollById(id: string, userId?: string) {
    const poll = await this.prisma.poll.findUnique({
      where: { id },
      include: {
        options: {
          orderBy: { sortOrder: 'asc' },
          include: {
            _count: { select: { votes: true } },
            votes: userId
              ? { where: { user: { clerkId: userId } }, select: { id: true } }
              : false,
          },
        },
      },
    });

    if (!poll) return null;

    // Check if expired
    if (poll.endsAt && new Date(poll.endsAt) < new Date() && poll.status === 'ACTIVE') {
      await this.prisma.poll.update({ where: { id }, data: { status: 'CLOSED' } });
      (poll as any).status = 'CLOSED';
    }

    return poll;
  }

  // ── Vote ──

  async vote(pollId: string, optionId: string, userId: string) {
    const poll = await this.prisma.poll.findUnique({
      where: { id: pollId },
      include: { options: true },
    });
    if (!poll || poll.status !== 'ACTIVE') throw new Error('Poll not available');

    const option = poll.options.find((o) => o.id === optionId);
    if (!option) throw new Error('Invalid option');

    const user = await this.prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) throw new Error('User not found');

    // Single choice: remove existing votes first
    if (!poll.isMultiple) {
      const existingVotes = await this.prisma.pollVote.findMany({
        where: { userId: user.id, option: { pollId } },
      });
      if (existingVotes.length > 0) {
        await this.prisma.pollVote.deleteMany({
          where: { id: { in: existingVotes.map((v) => v.id) } },
        });
        // Decrement counters
        for (const v of existingVotes) {
          await this.prisma.pollOption.update({
            where: { id: v.optionId },
            data: { voteCount: { decrement: 1 } },
          });
        }
        await this.prisma.poll.update({
          where: { id: pollId },
          data: { totalVotes: { decrement: existingVotes.length } },
        });
      }
    }

    // Create vote
    const vote = await this.prisma.pollVote.create({
      data: { optionId, userId: user.id },
    });

    // Increment counters
    await this.prisma.pollOption.update({
      where: { id: optionId },
      data: { voteCount: { increment: 1 } },
    });
    await this.prisma.poll.update({
      where: { id: pollId },
      data: { totalVotes: { increment: 1 } },
    });

    return vote;
  }

  // ── Close Poll ──

  async closePoll(id: string) {
    return this.prisma.poll.update({
      where: { id },
      data: { status: 'CLOSED' },
    });
  }

  async deletePoll(id: string) {
    return this.prisma.poll.delete({ where: { id } });
  }
}
