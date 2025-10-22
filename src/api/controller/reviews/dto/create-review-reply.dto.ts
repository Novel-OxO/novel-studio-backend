import { IsString, Length } from 'class-validator';

export class CreateReviewReplyDto {
  @IsString()
  @Length(10, 2000)
  content: string;
}
