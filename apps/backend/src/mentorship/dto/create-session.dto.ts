import { IsString, IsOptional, IsDateString, IsNumber } from 'class-validator';

export class CreateMentorshipSessionDto {
  @IsString()
  mentorProfileId: string;

  @IsString()
  menteeId: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDateString()
  scheduledAt: string;

  @IsOptional()
  @IsNumber()
  duration?: number;

  @IsOptional()
  @IsString()
  meetingUrl?: string;

  @IsOptional()
  @IsNumber()
  tksCost?: number;
}
