import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class MentorshipService {
  private readonly logger = new Logger(MentorshipService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
    private readonly redis: RedisService,
  ) {}

  // -- Mentor Profiles --
  async createMentorProfile(userId: string, data: any) {
    const profile = await this.prisma.mentorProfile.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    });

    // Fire-and-forget: generate embedding without blocking the response
    this.generateAndStoreMentorEmbedding(profile).catch((err) =>
      this.logger.warn(`Failed to embed mentor profile ${profile.id}: ${err.message}`),
    );

    return profile;
  }

  private async generateAndStoreMentorEmbedding(profile: any): Promise<void> {
    const result = await this.aiService.embedMentor({
      mentorProfileId: profile.id,
      headline: profile.headline ?? '',
      bio: profile.bio ?? '',
      expertise: profile.expertise ?? [],
      industries: profile.industries ?? [],
    });

    if (!result || !result.embedding) {
      this.logger.warn(`Skipping embedding storage for mentor ${profile.id} due to AI Service failure.`);
      return;
    }

    const embeddingString = `[${result.embedding.join(',')}]`;
    // $executeRawUnsafe is used (with $1, $2... placeholders, no string interpolation
    // of inputs) because Prisma's tagged-template $executeRaw doesn't support the
    // `::vector` cast required for pgvector columns.
    await this.prisma.$executeRawUnsafe(`
      INSERT INTO "mentor_embeddings" ("id", "mentorProfileId", "embedding", "model", "createdAt", "updatedAt")
      VALUES ($1, $2, $3::vector, $4, NOW(), NOW())
      ON CONFLICT ("mentorProfileId") DO UPDATE SET "embedding" = $3::vector, "updatedAt" = NOW()
    `,
      `emb_${profile.id}`,
      profile.id,
      embeddingString,
      result.model ?? "paraphrase-multilingual-MiniLM-L12-v2"
    );

    // Invalidate any cached match results that included this mentor
    await this.redis.set(`mentor_embed_updated:${profile.id}`, '1', 600);
    this.logger.log(`Mentor embedding stored for ${profile.id} (${result.dimensions} dims)`);
  }

  async getMentorProfile(userId: string) {
    return this.prisma.mentorProfile.findUnique({
      where: { userId },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        reviews: {
          include: { mentee: { select: { firstName: true, lastName: true } } },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });
  }

  async searchMentors(filters: {
    expertise?: string;
    industry?: string;
    minRating?: number;
    maxRate?: number;
    page?: number;
    limit?: number;
  }) {
    const { page = 1, limit = 12 } = filters;
    const where: any = { isAvailable: true };

    if (filters.expertise) {
      where.expertise = { has: filters.expertise };
    }
    if (filters.industry) {
      where.industries = { has: filters.industry };
    }
    if (filters.minRating) {
      where.rating = { gte: filters.minRating };
    }
    if (filters.maxRate) {
      where.hourlyRate = { lte: filters.maxRate };
    }

    const [mentors, total] = await Promise.all([
      this.prisma.mentorProfile.findMany({
        where,
        include: {
          user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        },
        orderBy: { rating: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.mentorProfile.count({ where }),
    ]);

    return { mentors, total, page, totalPages: Math.ceil(total / limit) };
  }

  /**
   * AI-powered mentor matching.
   *
   * Strategy:
   *   1. Build a "mentee query" text from their interests + goals text → embed it.
   *   2. Fetch all mentor embeddings with their quality signals.
   *   3. Call the AI service hybrid ranker (semantic + rating + exp + sessions).
   *   4. Hydrate and return full mentor profiles in ranked order.
   *
   * Results are cached per (menteeId, goals) for 10 minutes.
   */
  async findMatchingMentors(
    menteeId: string,
    goals: string,
    topK = 10,
  ): Promise<any[]> {
    const cacheKey = `mentor_match:${menteeId}:${Buffer.from(goals).toString('base64').slice(0, 32)}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    try {
      // 1. Embed the mentee's goals/interests
      const menteeUser = await this.prisma.user.findUnique({
        where: { id: menteeId },
        include: { personalProfile: { select: { interests: true } } },
      });

      const interestsText = (menteeUser?.personalProfile?.interests ?? []).join(', ');
      const queryText = [goals, interestsText].filter(Boolean).join('. ') || 'mentorship';

      const queryResult = await this.aiService.embedListing({
        listingId: `mentee-${menteeId}`,
        title: queryText,
        description: queryText,
        tags: [],
      });

      if (!queryResult || !queryResult.embedding) {
        throw new Error('AI Service failed to generate query embedding');
      }

      // 2. Fetch all candidates and their embeddings from the database.
      // Exclude the mentee themselves from the candidate pool.
      const candidatesRaw: any[] = await this.prisma.$queryRawUnsafe(`
        SELECT 
          mp.id as "mentorProfileId",
          mp."yearsExp" as "years_exp",
          mp."totalSessions" as "total_sessions",
          mp."isAvailable" as "is_available",
          mp.rating,
          me.embedding::text as "embedding_str"
        FROM mentor_profiles mp
        INNER JOIN mentor_embeddings me ON me."mentorProfileId" = mp.id
        WHERE mp."userId" <> $1
      `, menteeId);

      if (candidatesRaw.length === 0) {
        throw new Error('No mentor candidates found');
      }

      const candidates = candidatesRaw.map(c => ({
        mentor_profile_id: c.mentorProfileId,
        embedding: JSON.parse(c.embedding_str),
        rating: Number(c.rating || 0),
        years_exp: Number(c.years_exp || 0),
        total_sessions: Number(c.total_sessions || 0),
        is_available: Boolean(c.is_available),
      }));

      // 3. Call the Python AI service ranker
      this.logger.log(`Calling matchMentors with ${candidates.length} candidates.`);
      const matches = await this.aiService.matchMentors({
        queryEmbedding: queryResult.embedding,
        candidates,
        topK,
      });

      this.logger.log(`FastAPI matching returned ${matches.length} matches.`);

      if (matches.length === 0) {
        throw new Error('AI matching returned no results');
      }

      // 4. Hydrate and return full mentor profiles in ranked order
      const rankedIds = matches.map((m) => m.mentor_profile_id);
      const profiles = await this.prisma.mentorProfile.findMany({
        where: { id: { in: rankedIds } },
        include: {
          user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true, isVerified: true } },
        },
      });

      this.logger.log(`Hydrated ${profiles.length} profiles from database.`);

      const matchMap = new Map(matches.map((m) => [m.mentor_profile_id, m]));
      const ranked = rankedIds
        .map((id) => {
          const profile = profiles.find((p) => p.id === id);
          if (!profile) return null;
          const matchInfo = matchMap.get(id);
          return { 
            ...profile, 
            _match: { 
              score: matchInfo?.score ?? 0,
              semantic_score: matchInfo?.semantic_score,
              rating_score: matchInfo?.rating_score,
              experience_score: matchInfo?.experience_score,
              sessions_score: matchInfo?.sessions_score,
            } 
          };
        })
        .filter(Boolean);

      this.logger.log(`Returning ${ranked.length} ranked profiles.`);

      await this.redis.set(cacheKey, JSON.stringify(ranked), 600);
      return ranked;
    } catch (err: any) {
      this.logger.warn(`Failed to execute AI mentor matching: ${err.message}. Falling back to default rating list.`);
      
      const fallbackProfiles = await this.prisma.mentorProfile.findMany({
        where: {
          isAvailable: true,
          userId: { not: menteeId }
        },
        take: topK,
        orderBy: { rating: 'desc' },
        include: {
          user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true, isVerified: true } },
        }
      });
      return fallbackProfiles.map(p => ({
        ...p,
        _match: { score: 0.5, reason: 'FALLBACK_RATING' }
      }));
    }
  }

  // -- Mentorship Requests --
  async createRequest(mentorProfileId: string, menteeId: string, data: { message?: string; goals?: string }) {
    const mentor = await this.prisma.mentorProfile.findUnique({
      where: { id: mentorProfileId },
    });

    if (!mentor) throw new NotFoundException('Mentor non trouve');
    if (!mentor.isAvailable) throw new BadRequestException('Mentor non disponible');
    if (mentor.activeMentees >= mentor.maxMentees) throw new BadRequestException('Mentor complet');
    if (mentor.userId === menteeId) throw new BadRequestException('Vous ne pouvez pas etre votre propre mentee');

    return this.prisma.mentorshipRequest.create({
      data: {
        mentorId: mentorProfileId,
        menteeId,
        message: data.message,
        goals: data.goals,
      },
    });
  }

  async respondToRequest(requestId: string, mentorUserId: string, status: 'ACCEPTED' | 'DECLINED') {
    const request = await this.prisma.mentorshipRequest.findUnique({
      where: { id: requestId },
      include: { mentor: true },
    });

    if (!request) throw new NotFoundException('Demande non trouvee');
    if (request.mentor.userId !== mentorUserId) throw new BadRequestException('Non autorise');

    const updated = await this.prisma.mentorshipRequest.update({
      where: { id: requestId },
      data: { status, respondedAt: new Date() },
    });

    if (status === 'ACCEPTED') {
      await this.prisma.mentorProfile.update({
        where: { id: request.mentorId },
        data: { activeMentees: { increment: 1 } },
      });
    }

    return updated;
  }

  async getUserRequests(userId: string, role: 'mentor' | 'mentee') {
    if (role === 'mentee') {
      return this.prisma.mentorshipRequest.findMany({
        where: { menteeId: userId },
        include: {
          mentor: {
            include: { user: { select: { firstName: true, lastName: true, avatarUrl: true } } },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    const mentorProfile = await this.prisma.mentorProfile.findUnique({ where: { userId } });
    if (!mentorProfile) return [];

    return this.prisma.mentorshipRequest.findMany({
      where: { mentorId: mentorProfile.id },
      include: {
        mentee: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // -- Sessions --
  async createSession(data: {
    mentorProfileId: string;
    menteeId: string;
    title: string;
    description?: string;
    scheduledAt: string;
    duration?: number;
    meetingUrl?: string;
    tksCost?: number;
  }) {
    return this.prisma.mentorshipSession.create({
      data: {
        mentorId: data.mentorProfileId,
        menteeId: data.menteeId,
        title: data.title,
        description: data.description,
        scheduledAt: new Date(data.scheduledAt),
        duration: data.duration || 60,
        meetingUrl: data.meetingUrl,
        tksCost: data.tksCost || 0,
      },
    });
  }

  async getUserSessions(userId: string, status?: string) {
    const mentorProfile = await this.prisma.mentorProfile.findUnique({ where: { userId } });

    const where: any = {
      OR: [
        { menteeId: userId },
        ...(mentorProfile ? [{ mentorId: mentorProfile.id }] : []),
      ],
    };
    if (status) where.status = status;

    return this.prisma.mentorshipSession.findMany({
      where,
      include: {
        mentor: {
          include: { user: { select: { firstName: true, lastName: true, avatarUrl: true } } },
        },
        mentee: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      },
      orderBy: { scheduledAt: 'asc' },
    });
  }

  async completeSession(sessionId: string, userId: string, notes?: string) {
    const session = await this.prisma.mentorshipSession.findUnique({
      where: { id: sessionId },
      include: { mentor: true },
    });

    if (!session) throw new NotFoundException('Session non trouvee');

    return this.prisma.mentorshipSession.update({
      where: { id: sessionId },
      data: { status: 'COMPLETED', completedAt: new Date(), notes },
    });
  }

  // -- Reviews --
  async createReview(mentorProfileId: string, menteeId: string, data: { rating: number; comment?: string }) {
    const review = await this.prisma.mentorshipReview.create({
      data: {
        mentorId: mentorProfileId,
        menteeId,
        rating: data.rating,
        comment: data.comment,
      },
    });

    const stats = await this.prisma.mentorshipReview.aggregate({
      where: { mentorId: mentorProfileId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await this.prisma.mentorProfile.update({
      where: { id: mentorProfileId },
      data: {
        rating: stats._avg.rating || 0,
        totalReviews: stats._count.rating,
      },
    });

    return review;
  }
}
