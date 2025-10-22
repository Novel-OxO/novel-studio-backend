import { IsInt, IsString, Length, Max, Min } from 'class-validator';

export class CreateReviewDto {
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @IsString()
  @Length(5, 100)
  title: string;

  @IsString()
  @Length(20, 2000)
  content: string;
}
