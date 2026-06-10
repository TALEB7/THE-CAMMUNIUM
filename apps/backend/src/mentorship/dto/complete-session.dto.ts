import { IsString, IsOptional } from 'class-validator';

export class CompleteMentorshipSessionDto {
  @IsString()
  userId: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
