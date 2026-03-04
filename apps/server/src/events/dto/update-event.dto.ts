import { IsString, IsOptional, IsNumber, IsDateString, IsIn } from 'class-validator';

export class UpdateEventDto {
  @IsString()
  organizerId: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsIn(['IN_PERSON', 'ONLINE', 'HYBRID'])
  eventType?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsNumber()
  maxAttendees?: number;

  @IsOptional()
  @IsNumber()
  price?: number;
}
