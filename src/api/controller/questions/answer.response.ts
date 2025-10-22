import { ApiProperty } from '@nestjs/swagger';

import { Answer } from '@/domain/questions/answer';

export class AnswerResponse {
  @ApiProperty({ description: '답변 ID' })
  id: string;

  @ApiProperty({ description: '답변 내용' })
  content: string;

  @ApiProperty({ description: '작성자 ID' })
  userId: string;

  @ApiProperty({ description: '질문 ID' })
  questionId: string;

  @ApiProperty({ description: '생성일시' })
  createdAt: Date;

  @ApiProperty({ description: '수정일시' })
  updatedAt: Date;

  static from(answer: Answer): AnswerResponse {
    const response = new AnswerResponse();
    response.id = answer.id;
    response.content = answer.content;
    response.userId = answer.userId;
    response.questionId = answer.questionId;
    response.createdAt = answer.createdAt;
    response.updatedAt = answer.updatedAt;
    return response;
  }
}
