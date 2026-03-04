import { IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PlaceBidDto {
  @ApiProperty({ example: 1500, description: 'Bid amount in MAD' })
  @IsNumber()
  @Min(1)
  amount: number;
}
