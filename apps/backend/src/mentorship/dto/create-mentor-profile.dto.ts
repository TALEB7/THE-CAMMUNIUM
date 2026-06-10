import { IsString, IsOptional, IsNumber, IsArray } from 'class-validator';

export class CreateMentorProfileDto {
  @IsString()
  userId: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  expertise?: string[];

  @IsOptional()
  @IsString()
  industry?: string;

  @IsOptional()
  @IsNumber()
  hourlyRate?: number;

  @IsOptional()
  @IsNumber()
  maxMentees?: number;
}
