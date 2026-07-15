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

  @IsOptional()
  @IsString()
  imageUrl?: string; // URL of an attached media file (photo, video, audio, document)

  @IsOptional()
  @IsString()
  fileName?: string; // Original file name

  @IsOptional()
  @IsString()
  fileType?: string; // MIME type, e.g. 'image/jpeg', 'video/mp4'
}

