import { Controller, Post, Body, HttpCode, UseGuards, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { OnboardingDto } from './dto/onboarding.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Login user and get JWT' })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('onboarding')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Complete user onboarding with account type' })
  async onboarding(@CurrentUser('email') currentEmail: string, @Body() dto: OnboardingDto) {
    if (dto.email !== currentEmail) {
      throw new ForbiddenException('Vous ne pouvez compléter que votre propre profil');
    }
    return this.authService.onboardUser(dto);
  }
}
