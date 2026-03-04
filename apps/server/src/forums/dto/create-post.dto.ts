import { IsString, IsOptional, IsArray } from 'class-validator';

export class CreateForumPostDto {
  @IsString()
  forumId: string;

  @IsString()
  authorId: string;

  @IsString()
  title: string;

  @IsString()
  content: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
