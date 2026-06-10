import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Param,
  Query,
  Body,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ApiTags } from '@nestjs/swagger';
import { DocumentsService } from './documents.service';
import { UploadDocumentDto, VerifyDocumentDto } from './dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('documents')
@Controller('documents')
export class DocumentsController {
  constructor(private readonly service: DocumentsService) {}

  @Post('cin/extract')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 8 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          return cb(new BadRequestException('Only image files are allowed'), false);
        }
        cb(null, true);
      },
    }),
  )
  extractCin(
    @CurrentUser('id') userId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No image uploaded');
    }
    return this.service.extractCinAndSyncProfile(userId, file);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  upload(@CurrentUser('id') userId: string, @Body() body: UploadDocumentDto) {
    return this.service.uploadDocument({ ...body, userId });
  }

  @Get('user/:userId')
  @UseGuards(JwtAuthGuard)
  getUserDocuments(
    @Param('userId') userId: string,
    @CurrentUser('id') currentUserId: string,
    @CurrentUser('role') role: string,
    @Query('type') type?: string,
  ) {
    if (userId !== currentUserId && role !== 'ADMIN') {
      throw new ForbiddenException('Accès refusé');
    }
    return this.service.getUserDocuments(userId, type);
  }

  @Get('admin/pending')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  getPendingDocuments(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.service.getPendingDocuments(page, limit);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  getDocument(@Param('id') id: string) {
    return this.service.getDocument(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  deleteDocument(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.service.deleteDocument(id, userId);
  }

  @Patch(':id/verify')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  verifyDocument(
    @Param('id') id: string,
    @CurrentUser('id') adminId: string,
    @Body() body: VerifyDocumentDto,
  ) {
    return this.service.verifyDocument(id, adminId, body);
  }
}
