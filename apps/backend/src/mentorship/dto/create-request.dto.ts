import { IsString, IsOptional } from 'class-validator';

export class CreateMentorshipRequestDto {
  @IsString()
  mentorProfileId: string;

  @IsString()
  menteeId: string;

  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  @IsString()
  goals?: string;
}
