import { IsString, IsNumber, IsOptional, IsDateString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAuctionDto {
  @ApiProperty({ description: 'ID of the listing to auction' })
  @IsString()
  listingId: string;

  @ApiProperty({ example: 1000, description: 'Starting bid price in MAD' })
  @IsNumber()
  @Min(1)
  startingPrice: number;

  @ApiPropertyOptional({ example: 5000, description: 'Reserve price (minimum to sell)' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  reservePrice?: number;

  @ApiPropertyOptional({ example: 50, description: 'Minimum bid increment in MAD', default: 10 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  minIncrement?: number;

  @ApiProperty({ example: '2026-03-01T10:00:00Z', description: 'Auction start time' })
  @IsDateString()
  startTime: string;

  @ApiProperty({ example: '2026-03-08T10:00:00Z', description: 'Auction end time' })
  @IsDateString()
  endTime: string;
}
