import { Controller, Get, Post, Put, Delete, Patch, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { EventsService } from './events.service';
import { CreateEventDto, UpdateEventDto, RsvpEventDto } from './dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('events')
@Controller('events')
export class EventsController {
  constructor(private readonly service: EventsService) {}

  // ── Events — public reads ───────────────────────────────────────────────────

  @Get()
  getEvents(
    @Query('city') city?: string,
    @Query('category') category?: string,
    @Query('eventType') eventType?: string,
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.service.getEvents({ city, category, eventType, status, page, limit });
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  getMyEvents(@CurrentUser('id') userId: string) {
    return this.service.getMyEvents(userId);
  }

  @Get('rsvps')
  @UseGuards(JwtAuthGuard)
  getMyRsvps(@CurrentUser('id') userId: string) {
    return this.service.getMyRsvps(userId);
  }

  @Get(':id')
  getEvent(@Param('id') id: string) {
    return this.service.getEvent(id);
  }

  // ── Events — authenticated mutations ────────────────────────────────────────

  @Post()
  @UseGuards(JwtAuthGuard)
  createEvent(@CurrentUser('id') userId: string, @Body() body: CreateEventDto) {
    return this.service.createEvent({ ...body, organizerId: userId });
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  updateEvent(@Param('id') id: string, @CurrentUser('id') userId: string, @Body() body: UpdateEventDto) {
    return this.service.updateEvent(id, userId, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  deleteEvent(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.service.deleteEvent(id, userId);
  }

  @Patch(':id/cancel')
  @UseGuards(JwtAuthGuard)
  cancelEvent(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.service.cancelEvent(id, userId);
  }

  // ── RSVPs ─────────────────────────────────────────────────────────────────────

  @Post(':id/rsvp')
  @UseGuards(JwtAuthGuard)
  rsvp(@Param('id') eventId: string, @CurrentUser('id') userId: string, @Body() body: RsvpEventDto) {
    return this.service.rsvp(eventId, userId, body.status);
  }

  @Delete(':id/rsvp')
  @UseGuards(JwtAuthGuard)
  cancelRsvp(@Param('id') eventId: string, @CurrentUser('id') userId: string) {
    return this.service.cancelRsvp(eventId, userId);
  }
}
