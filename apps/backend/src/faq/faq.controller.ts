import { Controller, Get, Post, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { FaqService } from './faq.service';

@ApiTags('faq')
@Controller('faq')
export class FaqController {
  constructor(private readonly faqService: FaqService) {}

  // ── Categories ──

  @Get('categories')
  @ApiOperation({ summary: 'Get FAQ categories' })
  getCategories() {
    return this.faqService.getCategories();
  }

  @Post('categories')
  @ApiOperation({ summary: 'Create FAQ category (admin)' })
  createCategory(@Body() body: any) {
    return this.faqService.createCategory(body);
  }

  @Patch('categories/:id')
  @ApiOperation({ summary: 'Update FAQ category (admin)' })
  updateCategory(@Param('id') id: string, @Body() body: any) {
    return this.faqService.updateCategory(id, body);
  }

  @Delete('categories/:id')
  @ApiOperation({ summary: 'Delete FAQ category (admin)' })
  deleteCategory(@Param('id') id: string) {
    return this.faqService.deleteCategory(id);
  }

  // ── Items ──

  @Get('categories/:categoryId/items')
  @ApiOperation({ summary: 'Get FAQ items by category' })
  getItemsByCategory(@Param('categoryId') categoryId: string) {
    return this.faqService.getItemsByCategory(categoryId);
  }

  @Get('items/slug/:slug')
  @ApiOperation({ summary: 'Get FAQ item by slug' })
  getBySlug(@Param('slug') slug: string) {
    return this.faqService.getItemBySlug(slug);
  }

  @Get('items/popular')
  @ApiOperation({ summary: 'Get popular FAQ items' })
  popular(@Query('limit') limit?: string) {
    return this.faqService.getPopular(limit ? parseInt(limit) : 10);
  }

  @Get('items/search')
  @ApiOperation({ summary: 'Search FAQ items' })
  search(@Query('q') q: string) {
    return this.faqService.search(q || '');
  }

  @Post('items')
  @ApiOperation({ summary: 'Create FAQ item (admin)' })
  createItem(@Body() body: any) {
    return this.faqService.createItem(body);
  }

  @Patch('items/:id')
  @ApiOperation({ summary: 'Update FAQ item (admin)' })
  updateItem(@Param('id') id: string, @Body() body: any) {
    return this.faqService.updateItem(id, body);
  }

  @Delete('items/:id')
  @ApiOperation({ summary: 'Delete FAQ item (admin)' })
  deleteItem(@Param('id') id: string) {
    return this.faqService.deleteItem(id);
  }

  @Post('items/:id/helpful')
  @ApiOperation({ summary: 'Vote FAQ item helpful/not helpful' })
  voteHelpful(@Param('id') id: string, @Body() body: { helpful: boolean }) {
    return this.faqService.voteHelpful(id, body.helpful);
  }
}
