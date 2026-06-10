import { IsString, IsNumber, IsOptional, IsArray, IsEnum, Min, MaxLength, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateListingDto {
  @ApiProperty({ example: 'iPhone 15 Pro Max - Excellent état' })
  @IsString()
  @MinLength(5)
  @MaxLength(200)
  title: string;

  @ApiProperty({ example: 'iPhone 15 Pro Max 256Go, acheté en décembre 2024...' })
  @IsString()
  @MinLength(20)
  @MaxLength(5000)
  description: string;

  @ApiProperty({ example: 12000 })
  @IsNumber()
  @Min(1)
  price: number;

  @ApiProperty({ example: 'cuid_category_id' })
  @IsString()
  categoryId: string;

  @ApiPropertyOptional({ enum: ['new', 'like_new', 'good', 'fair'], default: 'new' })
  @IsOptional()
  @IsEnum(['new', 'like_new', 'good', 'fair'])
  condition?: string;

  @ApiPropertyOptional({ example: 'Casablanca' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 'Maarif, Casablanca' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
