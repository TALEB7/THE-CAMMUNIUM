import { IsString, IsOptional } from 'class-validator';

export class CreateForumCommentDto {
  @IsString()
  authorId: string;

  @IsString()
  content: string;

  @IsOptional()
  @IsString()
  parentId?: string;
}
