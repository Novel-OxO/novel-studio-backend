import { IsEnum, IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

import { CourseLevel, CourseStatus } from '@prisma/client';

export class CreateCourseRequest {
  @ApiProperty({
    description: '코스 slug (URL에 사용될 고유 식별자)',
    example: 'nestjs-fundamentals',
  })
  @IsString({ message: 'slug는 문자열이어야 합니다.' })
  @MinLength(1, { message: 'slug는 최소 1자 이상이어야 합니다.' })
  slug: string;

  @ApiProperty({
    description: '코스 제목',
    example: 'NestJS 완벽 가이드',
  })
  @IsString({ message: '제목은 문자열이어야 합니다.' })
  @MinLength(1, { message: '제목은 최소 1자 이상이어야 합니다.' })
  title: string;

  @ApiProperty({
    description: '코스 설명',
    example: 'NestJS를 처음부터 끝까지 배우는 완벽한 강의입니다.',
  })
  @IsString({ message: '설명은 문자열이어야 합니다.' })
  @MinLength(1, { message: '설명은 최소 1자 이상이어야 합니다.' })
  description: string;

  @ApiProperty({
    description: '썸네일 이미지 URL',
    example: 'https://example.com/thumbnail.jpg',
    required: false,
  })
  @IsOptional()
  @IsString({ message: '썸네일 URL은 문자열이어야 합니다.' })
  thumbnailUrl?: string;

  @ApiProperty({
    description: '가격 (원)',
    example: 50000,
    default: 0,
    required: false,
  })
  @IsOptional()
  @IsInt({ message: '가격은 정수여야 합니다.' })
  @Min(0, { message: '가격은 0 이상이어야 합니다.' })
  price?: number;

  @ApiProperty({
    description: '난이도',
    enum: CourseLevel,
    example: CourseLevel.BEGINNER,
    default: CourseLevel.BEGINNER,
    required: false,
  })
  @IsOptional()
  @IsEnum(CourseLevel, { message: '유효한 난이도를 선택해주세요.' })
  level?: CourseLevel;

  @ApiProperty({
    description: '상태',
    enum: CourseStatus,
    example: CourseStatus.DRAFT,
    default: CourseStatus.DRAFT,
    required: false,
  })
  @IsOptional()
  @IsEnum(CourseStatus, { message: '유효한 상태를 선택해주세요.' })
  status?: CourseStatus;
}
