import { IsString, IsOptional, IsBoolean, IsArray, IsDateString } from 'class-validator';

export class CreatePollDto {
  @IsString()
  authorId: string;

  @IsString()
  question: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  context?: string;

  @IsOptional()
  @IsString()
  contextId?: string;

  @IsOptional()
  @IsBoolean()
  isMultiple?: boolean;

  @IsOptional()
  @IsBoolean()
  isAnonymous?: boolean;

  @IsOptional()
  @IsDateString()
  endsAt?: string;

  @IsArray()
  @IsString({ each: true })
  options: string[];
}
