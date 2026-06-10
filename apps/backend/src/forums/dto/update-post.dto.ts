import { IsString, IsOptional, IsArray } from 'class-validator';

export class UpdateForumPostDto {
  @IsString()
  authorId: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
