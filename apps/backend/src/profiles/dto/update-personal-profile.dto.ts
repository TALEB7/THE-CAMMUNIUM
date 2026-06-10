import { IsArray, IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePersonalProfileDto {
  @ApiPropertyOptional() @IsOptional() @IsString() firstName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() lastName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() birthday?: string;
  @ApiPropertyOptional({ enum: ['cin', 'passport'] }) @IsOptional() @IsEnum(['cin', 'passport']) identityType?: 'cin' | 'passport';
  @ApiPropertyOptional() @IsOptional() @IsString() identityNumber?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() phone?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() email?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() country?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() city?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() address?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() profession?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() avatarUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() accountType?: string;
  @ApiPropertyOptional({ type: [Object] }) @IsOptional() @IsArray() workHistory?: Array<{ title: string; company: string; startDate: string; endDate: string }>;
  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray() interests?: string[];
}
