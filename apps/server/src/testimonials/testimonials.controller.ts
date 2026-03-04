import { Controller, Get, Post, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { TestimonialsService } from './testimonials.service';

@ApiTags('testimonials')
@Controller('testimonials')
export class TestimonialsController {
  constructor(private readonly testimonialsService: TestimonialsService) {}

  // ── Public ──

  @Get()
  @ApiOperation({ summary: 'Get approved testimonials' })
  getApproved(@Query('limit') limit?: string) {
    return this.testimonialsService.getApproved(limit ? parseInt(limit) : 20);
  }

  @Get('featured')
  @ApiOperation({ summary: 'Get featured testimonials' })
  getFeatured(@Query('limit') limit?: string) {
    return this.testimonialsService.getFeatured(limit ? parseInt(limit) : 6);
  }

  // ── User ──

  @Post()
  @ApiOperation({ summary: 'Submit a testimonial' })
  create(@Body() body: { authorId: string; content: string; rating?: number; role?: string; company?: string }) {
    return this.testimonialsService.create(body);
  }

  @Get('user/:clerkId')
  @ApiOperation({ summary: 'Get user testimonials' })
  getUserTestimonials(@Param('clerkId') clerkId: string) {
    return this.testimonialsService.getUserTestimonials(clerkId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update testimonial' })
  update(@Param('id') id: string, @Body() body: { clerkId: string; content?: string; rating?: number; role?: string; company?: string }) {
    const { clerkId, ...data } = body;
    return this.testimonialsService.update(id, clerkId, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete testimonial' })
  remove(@Param('id') id: string, @Query('clerkId') clerkId: string) {
    return this.testimonialsService.remove(id, clerkId);
  }

  // ── Admin ──

  @Get('admin/all')
  @ApiOperation({ summary: 'Get all testimonials (admin)' })
  getAll(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.testimonialsService.getAll(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  @Patch(':id/approve')
  @ApiOperation({ summary: 'Approve testimonial (admin)' })
  approve(@Param('id') id: string) {
    return this.testimonialsService.approve(id);
  }

  @Patch(':id/reject')
  @ApiOperation({ summary: 'Reject testimonial (admin)' })
  reject(@Param('id') id: string) {
    return this.testimonialsService.reject(id);
  }

  @Patch(':id/feature')
  @ApiOperation({ summary: 'Toggle featured status (admin)' })
  toggleFeatured(@Param('id') id: string) {
    return this.testimonialsService.toggleFeatured(id);
  }
}
