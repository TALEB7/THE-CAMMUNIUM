import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class OnboardingDto {
  @ApiProperty({ description: 'Clerk user ID' })
  @IsString()
  @IsNotEmpty()
  clerkId: string;

  @ApiProperty({ enum: ['personal', 'business', 'company_creation'] })
  @IsEnum(['personal', 'business', 'company_creation'])
  accountType: 'personal' | 'business' | 'company_creation';

  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  lastName?: string;
}
