import { IsString, Length } from 'class-validator';

export class CreateQuestionDto {
  @IsString()
  @Length(5, 200)
  title: string;

  @IsString()
  @Length(20, 5000)
  content: string;
}
