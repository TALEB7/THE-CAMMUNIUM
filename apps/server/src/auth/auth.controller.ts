import { Controller, Post, Body, Headers, RawBodyRequest, Req, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { OnboardingDto } from './dto/onboarding.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Clerk Webhook — syncs user creation/updates to our database
   */
  @Post('webhook/clerk')
  @HttpCode(200)
  @ApiOperation({ summary: 'Clerk webhook endpoint' })
  async handleClerkWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('svix-id') svixId: string,
    @Headers('svix-timestamp') svixTimestamp: string,
    @Headers('svix-signature') svixSignature: string,
  ) {
    return this.authService.handleClerkWebhook(req.rawBody!, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    });
  }

  /**
   * Onboarding — called after sign-up to set account type
   */
  @Post('onboarding')
  @ApiOperation({ summary: 'Complete user onboarding with account type' })
  async onboarding(@Body() dto: OnboardingDto) {
    return this.authService.onboardUser(dto);
  }
}
