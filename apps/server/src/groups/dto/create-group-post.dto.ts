import { IsString, IsOptional, IsArray } from 'class-validator';

export class CreateGroupPostDto {
  @IsString()
  authorId: string;

  @IsString()
  content: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];
}
