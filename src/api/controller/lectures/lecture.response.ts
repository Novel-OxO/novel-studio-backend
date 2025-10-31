import { ApiProperty } from '@nestjs/swagger';

/**
 * 강의 목록 조회용 응답 DTO (videoUrl 제외)
 * 코스 상세 조회 시 섹션과 강의 목록을 보여주지만, 비디오 URL은 보안상 노출하지 않습니다.
 */
export class LecturePreviewResponse {
  @ApiProperty({
    description: '렉처 ID',
    example: 'uuid-1234-5678-9012',
  })
  id: string;

  @ApiProperty({
    description: '렉처 제목',
    example: '1. TypeScript 기초',
  })
  title: string;

  @ApiProperty({
    description: '렉처 설명',
    example: 'TypeScript의 기본 문법을 배웁니다.',
    nullable: true,
  })
  description: string | null;

  @ApiProperty({
    description: '렉처 순서',
    example: 1,
  })
  order: number;

  @ApiProperty({
    description: '렉처 재생 시간 (초 단위)',
    example: 600,
    nullable: true,
  })
  duration: number | null;

  @ApiProperty({
    description: '미리보기 가능 여부',
    example: false,
  })
  isPreview: boolean;

  @ApiProperty({
    description: '섹션 ID',
    example: 'uuid-section-1234',
  })
  sectionId: string;

  @ApiProperty({
    description: '코스 ID',
    example: 'uuid-course-1234',
  })
  courseId: string;

  @ApiProperty({
    description: '생성일시',
    example: '2023-10-17T12:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: '수정일시',
    example: '2023-10-17T12:00:00.000Z',
  })
  updatedAt: Date;

  constructor(
    id: string,
    title: string,
    description: string | null,
    order: number,
    duration: number | null,
    isPreview: boolean,
    sectionId: string,
    courseId: string,
    createdAt: Date,
    updatedAt: Date,
  ) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.order = order;
    this.duration = duration;
    this.isPreview = isPreview;
    this.sectionId = sectionId;
    this.courseId = courseId;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}

export class LectureResponse {
  @ApiProperty({
    description: '렉처 ID',
    example: 'uuid-1234-5678-9012',
  })
  id: string;

  @ApiProperty({
    description: '렉처 제목',
    example: '1. TypeScript 기초',
  })
  title: string;

  @ApiProperty({
    description: '렉처 설명',
    example: 'TypeScript의 기본 문법을 배웁니다.',
    nullable: true,
  })
  description: string | null;

  @ApiProperty({
    description: '렉처 순서',
    example: 1,
  })
  order: number;

  @ApiProperty({
    description: '렉처 재생 시간 (초 단위)',
    example: 600,
    nullable: true,
  })
  duration: number | null;

  @ApiProperty({
    description: '미리보기 가능 여부',
    example: false,
  })
  isPreview: boolean;

  @ApiProperty({
    description: '섹션 ID',
    example: 'uuid-section-1234',
  })
  sectionId: string;

  @ApiProperty({
    description: '코스 ID',
    example: 'uuid-course-1234',
  })
  courseId: string;

  @ApiProperty({
    description: '비디오 URL',
    example: 'https://example.com/video.mp4',
    nullable: true,
  })
  videoUrl: string | null;

  @ApiProperty({
    description: '생성일시',
    example: '2023-10-17T12:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: '수정일시',
    example: '2023-10-17T12:00:00.000Z',
  })
  updatedAt: Date;

  constructor(
    id: string,
    title: string,
    description: string | null,
    order: number,
    duration: number | null,
    videoUrl: string | null,
    isPreview: boolean,
    sectionId: string,
    courseId: string,
    createdAt: Date,
    updatedAt: Date,
  ) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.order = order;
    this.duration = duration;
    this.videoUrl = videoUrl;
    this.isPreview = isPreview;
    this.sectionId = sectionId;
    this.courseId = courseId;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}
