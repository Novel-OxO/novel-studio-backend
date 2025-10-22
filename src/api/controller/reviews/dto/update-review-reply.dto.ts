import { IsString, Length } from 'class-validator';

export class UpdateReviewReplyDto {
  @IsString()
  @Length(10, 2000)
  content: string;
}
