import {
  Controller, Get, Post, Patch, Body, Param, Query,
} from '@nestjs/common';
import { MentorshipService } from './mentorship.service';
import {
  CreateMentorProfileDto,
  CreateMentorshipRequestDto,
  RespondMentorshipRequestDto,
  CreateMentorshipSessionDto,
  CompleteMentorshipSessionDto,
  CreateMentorshipReviewDto,
} from './dto';

@Controller('mentorship')
export class MentorshipController {
  constructor(private readonly mentorshipService: MentorshipService) {}

  // -- Mentor Profiles --
  @Post('mentors')
  async createMentorProfile(@Body() body: CreateMentorProfileDto) {
    const { userId, ...data } = body;
    return this.mentorshipService.createMentorProfile(userId, data);
  }

  @Get('mentors/:userId')
  async getMentorProfile(@Param('userId') userId: string) {
    return this.mentorshipService.getMentorProfile(userId);
  }

  @Get('mentors')
  async searchMentors(
    @Query('expertise') expertise?: string,
    @Query('industry') industry?: string,
    @Query('minRating') minRating?: string,
    @Query('maxRate') maxRate?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.mentorshipService.searchMentors({
      expertise,
      industry,
      minRating: minRating ? parseFloat(minRating) : undefined,
      maxRate: maxRate ? parseInt(maxRate) : undefined,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 12,
    });
  }

  // -- Requests --
  @Post('requests')
  async createRequest(
    @Body() body: CreateMentorshipRequestDto,
  ) {
    return this.mentorshipService.createRequest(body.mentorProfileId, body.menteeId, body);
  }

  @Patch('requests/:id/respond')
  async respondToRequest(
    @Param('id') id: string,
    @Body() body: RespondMentorshipRequestDto,
  ) {
    return this.mentorshipService.respondToRequest(id, body.mentorUserId, body.status);
  }

  @Get('requests/:userId')
  async getUserRequests(
    @Param('userId') userId: string,
    @Query('role') role: 'mentor' | 'mentee' = 'mentee',
  ) {
    return this.mentorshipService.getUserRequests(userId, role);
  }

  // -- Sessions --
  @Post('sessions')
  async createSession(@Body() body: CreateMentorshipSessionDto) {
    return this.mentorshipService.createSession(body);
  }

  @Get('sessions/:userId')
  async getUserSessions(
    @Param('userId') userId: string,
    @Query('status') status?: string,
  ) {
    return this.mentorshipService.getUserSessions(userId, status);
  }

  @Patch('sessions/:id/complete')
  async completeSession(
    @Param('id') id: string,
    @Body() body: CompleteMentorshipSessionDto,
  ) {
    return this.mentorshipService.completeSession(id, body.userId, body.notes);
  }

  // -- Reviews --
  @Post('reviews')
  async createReview(
    @Body() body: CreateMentorshipReviewDto,
  ) {
    return this.mentorshipService.createReview(body.mentorProfileId, body.menteeId, body);
  }
}
