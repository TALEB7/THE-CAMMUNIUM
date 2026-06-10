import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class UpdateGroupDto {
  @IsString()
  ownerId: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isPrivate?: boolean;

  @IsOptional()
  @IsString()
  category?: string;
}
