import { IsString, IsOptional, IsNumber, Min, Max } from 'class-validator';

export class CreateMentorshipReviewDto {
  @IsString()
  mentorProfileId: string;

  @IsString()
  menteeId: string;

  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @IsOptional()
  @IsString()
  comment?: string;
}
