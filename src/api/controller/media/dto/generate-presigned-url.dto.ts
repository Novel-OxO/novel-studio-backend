import { IsString, Length } from 'class-validator';

export class GeneratePresignedUrlDto {
  @IsString()
  @Length(1, 255)
  fileName: string;
}
