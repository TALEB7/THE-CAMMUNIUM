import { Controller, Get, Post, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PollsService } from './polls.service';
import { CreatePollDto, VotePollDto } from './dto';

@ApiTags('polls')
@Controller('polls')
export class PollsController {
  constructor(private readonly pollsService: PollsService) {}

  @Post()
  @ApiOperation({ summary: 'Create poll' })
  create(@Body() body: CreatePollDto) {
    return this.pollsService.createPoll(body);
  }

  @Get()
  @ApiOperation({ summary: 'Browse polls' })
  findAll(
    @Query('context') context?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.pollsService.getPolls({
      context,
      status,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get poll by ID' })
  findOne(@Param('id') id: string, @Query('userId') userId?: string) {
    return this.pollsService.getPollById(id, userId);
  }

  @Post(':id/vote')
  @ApiOperation({ summary: 'Vote on a poll' })
  vote(
    @Param('id') id: string,
    @Body() body: VotePollDto,
  ) {
    return this.pollsService.vote(id, body.optionId, body.userId);
  }

  @Patch(':id/close')
  @ApiOperation({ summary: 'Close poll' })
  close(@Param('id') id: string) {
    return this.pollsService.closePoll(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete poll' })
  remove(@Param('id') id: string) {
    return this.pollsService.deletePoll(id);
  }
}
