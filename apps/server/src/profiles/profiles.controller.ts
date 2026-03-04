import {
  Controller,
  Get,
  Put,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ProfilesService } from './profiles.service';
import { ClerkAuthGuard } from '../common/guards/clerk-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UpdatePersonalProfileDto } from './dto/update-personal-profile.dto';
import { UpdateBusinessProfileDto } from './dto/update-business-profile.dto';

@ApiTags('profiles')
@Controller('profiles')
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  /**
   * Get current user's profile
   */
  @Get('me')
  @UseGuards(ClerkAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my profile' })
  async getMyProfile(@CurrentUser('clerkId') clerkId: string) {
    return this.profilesService.getProfileByClerkId(clerkId);
  }

  /**
   * Update personal profile
   */
  @Put('me')
  @UseGuards(ClerkAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update my profile' })
  async updateMyProfile(
    @CurrentUser('clerkId') clerkId: string,
    @Body() dto: UpdatePersonalProfileDto | UpdateBusinessProfileDto,
  ) {
    if ('accountType' in dto && dto.accountType === 'business') {
      return this.profilesService.updateBusinessProfile(clerkId, dto as UpdateBusinessProfileDto);
    }
    return this.profilesService.updatePersonalProfile(clerkId, dto as UpdatePersonalProfileDto);
  }

  /**
   * Get a user's public profile by ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get a public profile by ID' })
  async getPublicProfile(@Param('id') id: string) {
    return this.profilesService.getPublicProfile(id);
  }

  /**
   * Search profiles
   */
  @Get()
  @ApiOperation({ summary: 'Search profiles' })
  async searchProfiles(
    @Query('q') query?: string,
    @Query('city') city?: string,
    @Query('profession') profession?: string,
    @Query('type') type?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.profilesService.searchProfiles({
      query,
      city,
      profession,
      type,
      page,
      limit,
    });
  }
}
