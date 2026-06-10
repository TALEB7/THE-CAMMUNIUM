import { IsString, IsOptional } from 'class-validator';

export class RsvpEventDto {
  @IsString()
  userId: string;

  @IsOptional()
  @IsString()
  status?: string;
}
