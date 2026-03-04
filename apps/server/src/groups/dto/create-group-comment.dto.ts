import { IsString, IsOptional } from 'class-validator';

export class CreateGroupCommentDto {
  @IsString()
  authorId: string;

  @IsString()
  content: string;

  @IsOptional()
  @IsString()
  parentId?: string;
}
