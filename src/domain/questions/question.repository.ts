import { Answer } from './answer';
import { NewAnswer } from './new-answer';
import { NewQuestion } from './new-question';
import { Question } from './question';
import { UpdateAnswer } from './update-answer';
import { UpdateQuestion } from './update-question';

export const QUESTION_REPOSITORY = Symbol('QUESTION_REPOSITORY');

export interface QuestionFilter {
  userId?: string;
  sortBy?: 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

export interface QuestionListResult {
  questions: Question[];
  totalCount: number;
}

export interface IQuestionRepository {
  // 질문 조회
  findById(id: string): Promise<Question | null>;
  findByCourseId(
    courseId: string,
    page: number,
    pageSize: number,
    filter?: QuestionFilter,
  ): Promise<QuestionListResult>;
  findByUserId(userId: string): Promise<Question[]>;

  // 질문 CRUD
  save(question: NewQuestion): Promise<Question>;
  update(question: UpdateQuestion): Promise<Question>;
  delete(id: string): Promise<void>;

  // 답변 조회
  findAnswerById(id: string): Promise<Answer | null>;
  findAnswersByQuestionId(questionId: string): Promise<Answer[]>;

  // 답변 CRUD
  saveAnswer(answer: NewAnswer): Promise<Answer>;
  updateAnswer(answer: UpdateAnswer): Promise<Answer>;
  deleteAnswer(id: string): Promise<void>;
}
