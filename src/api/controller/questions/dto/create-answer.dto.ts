import { IsString, Length } from 'class-validator';

export class CreateAnswerDto {
  @IsString()
  @Length(10, 5000)
  content: string;
}
