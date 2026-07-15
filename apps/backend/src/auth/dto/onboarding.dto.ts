import { IsArray, IsEmail, IsEnum, IsOptional, IsString, ValidateIf } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class OnboardingDto {
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

  // Interests / sectors
  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  interests?: string[];

  // Personal Fields
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  birthday?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  identityType?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  identityNumber?: string;

  // Business Fields
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  companyName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  rc?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  creationDate?: string;

  @ApiProperty({ required: false, description: 'Fonction du déclarant (CEO, CFO, Investment Manager...)' })
  @IsOptional()
  @IsString()
  role?: string;

  @ApiProperty({ required: false, description: 'Nom complet de la personne en charge / représentant légal' })
  @IsOptional()
  @IsString()
  personInCharge?: string;

  @ApiProperty({ required: false, description: 'Email professionnel de l\'entreprise' })
  @IsOptional()
  @ValidateIf((o) => o.companyEmail !== '' && o.companyEmail != null)
  @IsEmail()
  companyEmail?: string;

  // Common Fields
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  selectedPlan?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  avatarUrl?: string;
}
