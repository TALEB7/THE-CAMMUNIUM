import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  Body,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { KycService } from './kyc.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('kyc')
@Controller('kyc')
export class KycController {
  constructor(private readonly kycService: KycService) {}

  @Get('status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user KYC status' })
  async getKycStatus(@CurrentUser('id') userId: string) {
    return this.kycService.getKycStatus(userId);
  }

  @Post('personal')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit personal KYC documents' })
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'cinFront', maxCount: 1 },
      { name: 'cinBack', maxCount: 1 },
      { name: 'selfie', maxCount: 1 },
    ], {
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    })
  )
  async submitPersonalKyc(
    @CurrentUser('id') userId: string,
    @UploadedFiles() files: {
      cinFront?: Express.Multer.File[];
      cinBack?: Express.Multer.File[];
      selfie?: Express.Multer.File[];
    },
    @Body() body: any,
  ) {
    return this.kycService.submitPersonalKyc(userId, files || {}, body);
  }

  @Post('business')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit business KYC (KYB) documents' })
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'rc', maxCount: 1 },
      { name: 'statuts', maxCount: 1 },
      { name: 'representativeId', maxCount: 1 },
      { name: 'taxCert', maxCount: 1 },
    ], {
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    })
  )
  async submitBusinessKyc(
    @CurrentUser('id') userId: string,
    @UploadedFiles() files: {
      rc?: Express.Multer.File[];
      statuts?: Express.Multer.File[];
      representativeId?: Express.Multer.File[];
      taxCert?: Express.Multer.File[];
    },
    @Body() body: any,
  ) {
    return this.kycService.submitBusinessKyc(userId, files || {}, body);
  }

  @Get('admin/business/pending')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: list pending KYB (business) verification requests' })
  async getPendingBusinessKyc(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.kycService.getPendingBusinessKyc(Number(page) || 1, Number(limit) || 20);
  }

  @Patch('admin/business/:id/review')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: approve or reject a KYB (business) verification request' })
  async reviewBusinessKyc(
    @Param('id') id: string,
    @Body() body: { status: 'approved' | 'rejected'; rejectionReason?: string },
  ) {
    return this.kycService.reviewBusinessKyc(id, body.status, body.rejectionReason);
  }
}
