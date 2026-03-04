import { Controller, Get, Post, Delete, Patch, Param, Query, Body, Headers } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DocumentsService } from './documents.service';
import { UploadDocumentDto, VerifyDocumentDto } from './dto';

@ApiTags('documents')
@Controller('documents')
export class DocumentsController {
  constructor(private readonly service: DocumentsService) {}

  @Post()
  upload(@Body() body: UploadDocumentDto) {
    return this.service.uploadDocument(body);
  }

  @Get('user/:userId')
  getUserDocuments(@Param('userId') userId: string, @Query('type') type?: string) {
    return this.service.getUserDocuments(userId, type);
  }

  @Get(':id')
  getDocument(@Param('id') id: string) {
    return this.service.getDocument(id);
  }

  @Delete(':id')
  deleteDocument(@Param('id') id: string, @Body('userId') userId: string) {
    return this.service.deleteDocument(id, userId);
  }

  // Admin
  @Get('admin/pending')
  getPendingDocuments(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.service.getPendingDocuments(page, limit);
  }

  @Patch(':id/verify')
  verifyDocument(
    @Param('id') id: string,
    @Headers('x-admin-id') adminId: string,
    @Body() body: VerifyDocumentDto,
  ) {
    return this.service.verifyDocument(id, adminId, body);
  }
}
