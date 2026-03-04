import { IsString, IsOptional } from 'class-validator';

export class SendConnectionRequestDto {
  @IsString()
  fromId: string;

  @IsString()
  toId: string;

  @IsOptional()
  @IsString()
  message?: string;
}
