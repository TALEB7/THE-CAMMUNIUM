import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSubscriptionDto {
  @ApiProperty({ enum: ['personal_premium', 'business_premium', 'company_creation'] })
  @IsString()
  @IsNotEmpty()
  planId: string;

  @ApiProperty({ enum: ['stripe', 'cmi'] })
  @IsEnum(['stripe', 'cmi'])
  paymentMethod: 'stripe' | 'cmi';
}
