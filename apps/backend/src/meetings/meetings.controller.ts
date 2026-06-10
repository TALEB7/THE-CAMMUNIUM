import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { MeetingsService } from './meetings.service';
import { CreateMeetingDto } from './dto';

@ApiTags('meetings')
@Controller('meetings')
export class MeetingsController {
  constructor(private readonly service: MeetingsService) {}

  /** Create a new meeting in a group */
  @Post()
  createMeeting(
    @Body() body: CreateMeetingDto,
  ) {
    return this.service.createMeeting(body);
  }

  /** Get a meeting by id */
  @Get(':id')
  getMeeting(@Param('id') id: string) {
    return this.service.getMeeting(id);
  }

  /** Get the currently active meeting for a group (if any) */
  @Get('group/:groupId/active')
  getActiveMeeting(@Param('groupId') groupId: string) {
    return this.service.getActiveMeeting(groupId);
  }

  /** Get meeting history for a group */
  @Get('group/:groupId')
  getGroupMeetings(
    @Param('groupId') groupId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.service.getGroupMeetings(groupId, page, limit);
  }

  /** Join a meeting */
  @Post(':id/join')
  joinMeeting(
    @Param('id') id: string,
    @Body('userId') userId: string,
  ) {
    return this.service.joinMeeting(id, userId);
  }

  /** Leave a meeting */
  @Post(':id/leave')
  leaveMeeting(
    @Param('id') id: string,
    @Body('userId') userId: string,
  ) {
    return this.service.leaveMeeting(id, userId);
  }

  /** End the meeting (host only) */
  @Post(':id/end')
  endMeeting(
    @Param('id') id: string,
    @Body('userId') userId: string,
  ) {
    return this.service.endMeeting(id, userId);
  }
}
