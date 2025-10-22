import { IsInt, IsOptional, IsString, Length, Max, Min } from 'class-validator';

export class UpdateReviewDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @IsOptional()
  @IsString()
  @Length(5, 100)
  title?: string;

  @IsOptional()
  @IsString()
  @Length(20, 2000)
  content?: string;
}
