import { IsString } from 'class-validator';

export class BlockUserDto {
  @IsString()
  fromId: string;

  @IsString()
  toId: string;
}
