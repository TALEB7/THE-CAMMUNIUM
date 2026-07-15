import { IsArray, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateBusinessProfileDto {
  @ApiPropertyOptional() @IsOptional() @IsString() companyName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() rc?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() creationDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() phone?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() email?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() country?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() city?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() address?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() activities?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() ice?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() ifNumber?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() logoUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() avatarUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() accountType?: string;
  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray() interests?: string[];

  @ApiPropertyOptional() @IsOptional() @IsString() bio?: string;
  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray() licenses?: string[];
  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray() certifications?: string[];
  @ApiPropertyOptional() @IsOptional() @IsString() headquarters?: string;
  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray() subsidiaries?: string[];
  @ApiPropertyOptional() @IsOptional() @IsString() website?: string;
  @ApiPropertyOptional({ type: [Object] }) @IsOptional() @IsArray() technicalEquipment?: Array<{ name: string; count: number }>;
  @ApiPropertyOptional({ type: [Object] }) @IsOptional() @IsArray() humanResources?: Array<{ role: string; count: number }>;
  @ApiPropertyOptional({ type: [Object] }) @IsOptional() @IsArray() events?: Array<{ title: string; date: string; location: string }>;
  @ApiPropertyOptional({ type: [Object] }) @IsOptional() @IsArray() onlineMeetings?: Array<{ title: string; date: string; platform: string }>;
  @ApiPropertyOptional({ type: [Object] }) @IsOptional() @IsArray() trainingPrograms?: Array<{ title: string; date: string; location: string }>;
  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray() sectorsOfInterests?: string[];
}
