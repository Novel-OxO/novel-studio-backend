import { ApiProperty } from '@nestjs/swagger';

export class SectionResponse {
  @ApiProperty({
    description: '섹션 ID',
    example: 'uuid-1234-5678-9012',
  })
  id: string;

  @ApiProperty({
    description: '섹션 제목',
    example: '1. 시작하기',
  })
  title: string;

  @ApiProperty({
    description: '섹션 순서',
    example: 1,
  })
  order: number;

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

  constructor(id: string, title: string, order: number, courseId: string, createdAt: Date, updatedAt: Date) {
    this.id = id;
    this.title = title;
    this.order = order;
    this.courseId = courseId;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}
