import { Controller, Get, Post, Put, Delete, Patch, Param, Query, Body } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { EventsService } from './events.service';
import { CreateEventDto, UpdateEventDto, RsvpEventDto } from './dto';

@ApiTags('events')
@Controller('events')
export class EventsController {
  constructor(private readonly service: EventsService) {}

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

  @Get('my/:userId')
  getMyEvents(@Param('userId') userId: string) {
    return this.service.getMyEvents(userId);
  }

  @Get('rsvps/:userId')
  getMyRsvps(@Param('userId') userId: string) {
    return this.service.getMyRsvps(userId);
  }

  @Get(':id')
  getEvent(@Param('id') id: string) {
    return this.service.getEvent(id);
  }

  @Post()
  createEvent(@Body() body: CreateEventDto) {
    return this.service.createEvent(body);
  }

  @Put(':id')
  updateEvent(@Param('id') id: string, @Body() body: UpdateEventDto) {
    return this.service.updateEvent(id, body.organizerId, body);
  }

  @Delete(':id')
  deleteEvent(@Param('id') id: string, @Body('organizerId') organizerId: string) {
    return this.service.deleteEvent(id, organizerId);
  }

  @Patch(':id/cancel')
  cancelEvent(@Param('id') id: string, @Body('organizerId') organizerId: string) {
    return this.service.cancelEvent(id, organizerId);
  }

  @Post(':id/rsvp')
  rsvp(@Param('id') eventId: string, @Body() body: RsvpEventDto) {
    return this.service.rsvp(eventId, body.userId, body.status);
  }

  @Delete(':id/rsvp')
  cancelRsvp(@Param('id') eventId: string, @Body('userId') userId: string) {
    return this.service.cancelRsvp(eventId, userId);
  }
}
