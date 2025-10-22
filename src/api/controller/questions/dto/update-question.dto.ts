import { IsOptional, IsString, Length } from 'class-validator';

export class UpdateQuestionDto {
  @IsOptional()
  @IsString()
  @Length(5, 200)
  title?: string;

  @IsOptional()
  @IsString()
  @Length(20, 5000)
  content?: string;
}
