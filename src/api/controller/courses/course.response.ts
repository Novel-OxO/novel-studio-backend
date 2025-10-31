import { ApiProperty } from '@nestjs/swagger';

import { CourseLevel, CourseStatus } from '@prisma/client';

import { LecturePreviewResponse, LectureResponse } from '@/api/controller/lectures/lecture.response';
import { SectionResponse } from '@/api/controller/sections/section.response';

export class CourseResponse {
  @ApiProperty({
    description: '코스 ID',
    example: 'uuid-1234-5678-9012',
  })
  id: string;

  @ApiProperty({
    description: '코스 slug',
    example: 'nestjs-fundamentals',
  })
  slug: string;

  @ApiProperty({
    description: '코스 제목',
    example: 'NestJS 완벽 가이드',
  })
  title: string;

  @ApiProperty({
    description: '코스 설명',
    example: 'NestJS를 처음부터 끝까지 배우는 완벽한 강의입니다.',
  })
  description: string;

  @ApiProperty({
    description: '썸네일 이미지 URL',
    example: 'https://example.com/thumbnail.jpg',
    nullable: true,
  })
  thumbnailUrl: string | null;

  @ApiProperty({
    description: '가격 (원)',
    example: 50000,
  })
  price: number;

  @ApiProperty({
    description: '난이도',
    enum: CourseLevel,
    example: CourseLevel.BEGINNER,
  })
  level: CourseLevel;

  @ApiProperty({
    description: '상태',
    enum: CourseStatus,
    example: CourseStatus.DRAFT,
  })
  status: CourseStatus;

  @ApiProperty({
    description: '생성일시',
    example: '2023-10-17T12:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: '섹션 목록',
    type: [SectionResponse],
    required: false,
  })
  sections?: SectionResponse[];

  @ApiProperty({
    description: '강의 목록',
    type: [LectureResponse],
    required: false,
  })
  lectures?: LectureResponse[] | LecturePreviewResponse[];

  constructor(
    id: string,
    slug: string,
    title: string,
    description: string,
    thumbnailUrl: string | null,
    price: number,
    level: CourseLevel,
    status: CourseStatus,
    createdAt: Date,
    sections?: SectionResponse[],
    lectures?: LectureResponse[] | LecturePreviewResponse[],
  ) {
    this.id = id;
    this.slug = slug;
    this.title = title;
    this.description = description;
    this.thumbnailUrl = thumbnailUrl;
    this.price = price;
    this.level = level;
    this.status = status;
    this.createdAt = createdAt;
    this.sections = sections;
    this.lectures = lectures;
  }
}
