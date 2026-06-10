import { Controller, Get, Post, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { NewsletterService } from './newsletter.service';

@ApiTags('newsletter')
@Controller('newsletter')
export class NewsletterController {
  constructor(private readonly newsletterService: NewsletterService) {}

  // ── Public subscription ──

  @Post('subscribe')
  @ApiOperation({ summary: 'Subscribe to newsletter' })
  subscribe(@Body() body: { email: string; firstName?: string; lastName?: string; userId?: string }) {
    return this.newsletterService.subscribe(body);
  }

  @Post('unsubscribe')
  @ApiOperation({ summary: 'Unsubscribe from newsletter' })
  unsubscribe(@Body() body: { email: string }) {
    return this.newsletterService.unsubscribe(body.email);
  }

  // ── Admin: Subscribers ──

  @Get('subscribers')
  @ApiOperation({ summary: 'Get subscribers (admin)' })
  getSubscribers(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.newsletterService.getSubscribers(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 50,
    );
  }

  @Get('subscribers/stats')
  @ApiOperation({ summary: 'Get subscriber stats (admin)' })
  getStats() {
    return this.newsletterService.getStats();
  }

  // ── Admin: Campaigns ──

  @Post('campaigns')
  @ApiOperation({ summary: 'Create newsletter campaign' })
  createCampaign(@Body() body: { subject: string; content: string; previewText?: string }) {
    return this.newsletterService.createCampaign(body);
  }

  @Get('campaigns')
  @ApiOperation({ summary: 'List campaigns' })
  getCampaigns(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.newsletterService.getCampaigns(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  @Get('campaigns/:id')
  @ApiOperation({ summary: 'Get campaign by ID' })
  getCampaign(@Param('id') id: string) {
    return this.newsletterService.getCampaignById(id);
  }

  @Patch('campaigns/:id')
  @ApiOperation({ summary: 'Update campaign' })
  updateCampaign(@Param('id') id: string, @Body() body: any) {
    return this.newsletterService.updateCampaign(id, body);
  }

  @Post('campaigns/:id/send')
  @ApiOperation({ summary: 'Send campaign' })
  sendCampaign(@Param('id') id: string) {
    return this.newsletterService.sendCampaign(id);
  }

  @Delete('campaigns/:id')
  @ApiOperation({ summary: 'Delete campaign' })
  deleteCampaign(@Param('id') id: string) {
    return this.newsletterService.deleteCampaign(id);
  }

  // ── Public: Contact ──

  @Post('contact')
  @ApiOperation({ summary: 'Submit contact message' })
  submitContact(@Body() body: { name: string; email: string; subject: string; message: string; userId?: string }) {
    return this.newsletterService.submitContact(body);
  }

  // ── Admin: Contact messages ──

  @Get('contact')
  @ApiOperation({ summary: 'Get contact messages (admin)' })
  getContactMessages(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    return this.newsletterService.getContactMessages(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
      status,
    );
  }

  @Patch('contact/:id')
  @ApiOperation({ summary: 'Update contact message status' })
  updateContactStatus(
    @Param('id') id: string,
    @Body() body: { status: string; replyContent?: string },
  ) {
    return this.newsletterService.updateContactStatus(id, body.status, body.replyContent);
  }

  @Get('contact/stats')
  @ApiOperation({ summary: 'Get contact message stats' })
  getContactStats() {
    return this.newsletterService.getContactStats();
  }
}
