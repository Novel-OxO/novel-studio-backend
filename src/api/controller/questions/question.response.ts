import { ApiProperty } from '@nestjs/swagger';

import { Question } from '@/domain/questions/question';

export class QuestionResponse {
  @ApiProperty({ description: '질문 ID' })
  id: string;

  @ApiProperty({ description: '질문 제목' })
  title: string;

  @ApiProperty({ description: '질문 내용' })
  content: string;

  @ApiProperty({ description: '작성자 ID' })
  userId: string;

  @ApiProperty({ description: '강의 ID' })
  courseId: string;

  @ApiProperty({ description: '생성일시' })
  createdAt: Date;

  @ApiProperty({ description: '수정일시' })
  updatedAt: Date;

  static from(question: Question): QuestionResponse {
    const response = new QuestionResponse();
    response.id = question.id;
    response.title = question.title;
    response.content = question.content;
    response.userId = question.userId;
    response.courseId = question.courseId;
    response.createdAt = question.createdAt;
    response.updatedAt = question.updatedAt;
    return response;
  }
}
