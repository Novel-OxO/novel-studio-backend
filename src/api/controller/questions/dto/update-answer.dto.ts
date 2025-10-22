import { IsString, Length } from 'class-validator';

export class UpdateAnswerDto {
  @IsString()
  @Length(10, 5000)
  content: string;
}
