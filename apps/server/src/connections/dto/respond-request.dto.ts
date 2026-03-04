import { IsString, IsIn } from 'class-validator';

export class RespondConnectionRequestDto {
  @IsString()
  userId: string;

  @IsIn(['ACCEPTED', 'REJECTED'])
  action: 'ACCEPTED' | 'REJECTED';
}
