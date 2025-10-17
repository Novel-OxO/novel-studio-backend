import { IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

export class CreateSectionRequest {
  @ApiProperty({
    description: '섹션 제목',
    example: '1. 시작하기',
  })
  @IsString({ message: '제목은 문자열이어야 합니다.' })
  @MinLength(1, { message: '제목은 최소 1자 이상이어야 합니다.' })
  title: string;

  @ApiProperty({
    description: '섹션 순서',
    example: 1,
  })
  @IsInt({ message: '순서는 정수여야 합니다.' })
  @Min(0, { message: '순서는 0 이상이어야 합니다.' })
  order: number;
}

export class UpdateSectionRequest {
  @ApiProperty({
    description: '섹션 제목',
    example: '1. 시작하기',
    required: false,
  })
  @IsOptional()
  @IsString({ message: '제목은 문자열이어야 합니다.' })
  @MinLength(1, { message: '제목은 최소 1자 이상이어야 합니다.' })
  title?: string;

  @ApiProperty({
    description: '섹션 순서',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsInt({ message: '순서는 정수여야 합니다.' })
  @Min(0, { message: '순서는 0 이상이어야 합니다.' })
  order?: number;
}
