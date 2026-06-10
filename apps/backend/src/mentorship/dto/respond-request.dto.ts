import { IsString, IsIn } from 'class-validator';

export class RespondMentorshipRequestDto {
  @IsString()
  mentorUserId: string;

  @IsIn(['ACCEPTED', 'DECLINED'])
  status: 'ACCEPTED' | 'DECLINED';
}
