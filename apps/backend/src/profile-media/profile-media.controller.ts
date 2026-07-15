import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ProfileMediaService } from './profile-media.service';

@ApiTags('profile-media')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('profile-media')
export class ProfileMediaController {
  constructor(private readonly profileMediaService: ProfileMediaService) {}

  /**
   * GET /profile-media/me?type=photo|video|music|document
   * Get the current user's media
   */
  @Get('me')
  @ApiOperation({ summary: "Get current user's profile media" })
  getMyMedia(@Request() req: any, @Query('type') type?: string) {
    return this.profileMediaService.getMyMedia(req.user.id, type);
  }

  /**
   * GET /profile-media/user/:id?type=photo|video|music|document
   * Get any user's public media
   */
  @Get('user/:id')
  @ApiOperation({ summary: "Get any user's profile media" })
  getUserMedia(@Param('id') id: string, @Query('type') type?: string) {
    return this.profileMediaService.getUserMedia(id, type);
  }

  /**
   * POST /profile-media
   * Manually add a media entry (direct upload from profile)
   */
  @Post()
  @ApiOperation({ summary: 'Add a media entry to profile' })
  createMedia(
    @Request() req: any,
    @Body() body: {
      url: string;
      mimeType: string;
      name?: string;
      size?: number;
      caption?: string;
    },
  ) {
    return this.profileMediaService.createMedia({
      userId: req.user.id,
      ...body,
    });
  }

  /**
   * DELETE /profile-media/:id
   * Delete a media entry (owner only)
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a media entry' })
  deleteMedia(@Request() req: any, @Param('id') id: string) {
    return this.profileMediaService.deleteMedia(id, req.user.id);
  }
}
