import { IsBoolean, IsInt, IsJSON, IsOptional, IsString, IsUUID, Min, MinLength } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

export class CreateLectureRequest {
  @ApiProperty({
    description: '렉처 제목',
    example: '1. TypeScript 기초',
  })
  @IsString({ message: '제목은 문자열이어야 합니다.' })
  @MinLength(1, { message: '제목은 최소 1자 이상이어야 합니다.' })
  title: string;

  @ApiProperty({
    description: '렉처 설명',
    example: 'TypeScript의 기본 문법을 배웁니다.',
    required: false,
  })
  @IsOptional()
  @IsString({ message: '설명은 문자열이어야 합니다.' })
  description?: string;

  @ApiProperty({
    description: '렉처 순서',
    example: 1,
  })
  @IsInt({ message: '순서는 정수여야 합니다.' })
  @Min(0, { message: '순서는 0 이상이어야 합니다.' })
  order: number;

  @ApiProperty({
    description: '렉처 재생 시간 (초 단위)',
    example: 600,
    required: false,
  })
  @IsOptional()
  @IsInt({ message: '재생 시간은 정수여야 합니다.' })
  @Min(0, { message: '재생 시간은 0 이상이어야 합니다.' })
  duration?: number;

  @ApiProperty({
    description: '미리보기 가능 여부',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: '미리보기 여부는 불리언이어야 합니다.' })
  isPreview?: boolean;

  @ApiProperty({
    description: '섹션 ID',
    example: 'uuid-section-1234',
  })
  @IsUUID('4', { message: '유효한 UUID 형식이어야 합니다.' })
  sectionId: string;

  @ApiProperty({
    description: '비디오 저장 정보 (JSON)',
    example: { url: 'https://example.com/video.mp4', key: 'video123' },
    required: false,
  })
  @IsOptional()
  @IsJSON({ message: '비디오 저장 정보는 유효한 JSON이어야 합니다.' })
  videoStorageInfo?: string;
}

export class UpdateLectureRequest {
  @ApiProperty({
    description: '렉처 제목',
    example: '1. TypeScript 기초',
    required: false,
  })
  @IsOptional()
  @IsString({ message: '제목은 문자열이어야 합니다.' })
  @MinLength(1, { message: '제목은 최소 1자 이상이어야 합니다.' })
  title?: string;

  @ApiProperty({
    description: '렉처 설명',
    example: 'TypeScript의 기본 문법을 배웁니다.',
    required: false,
  })
  @IsOptional()
  @IsString({ message: '설명은 문자열이어야 합니다.' })
  description?: string;

  @ApiProperty({
    description: '렉처 순서',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsInt({ message: '순서는 정수여야 합니다.' })
  @Min(0, { message: '순서는 0 이상이어야 합니다.' })
  order?: number;

  @ApiProperty({
    description: '렉처 재생 시간 (초 단위)',
    example: 600,
    required: false,
  })
  @IsOptional()
  @IsInt({ message: '재생 시간은 정수여야 합니다.' })
  @Min(0, { message: '재생 시간은 0 이상이어야 합니다.' })
  duration?: number;

  @ApiProperty({
    description: '미리보기 가능 여부',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: '미리보기 여부는 불리언이어야 합니다.' })
  isPreview?: boolean;

  @ApiProperty({
    description: '비디오 저장 정보 (JSON)',
    example: { url: 'https://example.com/video.mp4', key: 'video123' },
    required: false,
  })
  @IsOptional()
  @IsJSON({ message: '비디오 저장 정보는 유효한 JSON이어야 합니다.' })
  videoStorageInfo?: string;
}
