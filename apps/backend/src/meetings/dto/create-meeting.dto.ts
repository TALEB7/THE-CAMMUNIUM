import { IsString, IsOptional, IsNumber } from 'class-validator';

export class CreateMeetingDto {
  @IsString()
  groupId: string;

  @IsString()
  hostId: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsNumber()
  maxParticipants?: number;
}
