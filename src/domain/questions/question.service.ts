import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';

import { COURSE_REPOSITORY, type ICourseRepository } from '@/domain/courses/course.repository';
import { ENROLLMENT_REPOSITORY, type IEnrollmentRepository } from '@/domain/enrollments/enrollment.repository';

import { Answer } from './answer';
import { NewAnswer } from './new-answer';
import { NewQuestion } from './new-question';
import { Question } from './question';
import { QUESTION_REPOSITORY, QuestionListResult, type IQuestionRepository } from './question.repository';
import { UpdateAnswer } from './update-answer';
import { UpdateQuestion } from './update-question';

@Injectable()
export class QuestionService {
  constructor(
    @Inject(QUESTION_REPOSITORY)
    private readonly questionRepository: IQuestionRepository,
    @Inject(ENROLLMENT_REPOSITORY)
    private readonly enrollmentRepository: IEnrollmentRepository,
    @Inject(COURSE_REPOSITORY)
    private readonly courseRepository: ICourseRepository,
  ) {}

  /**
   * 질문 작성
   * - 수강 여부 확인
   */
  async createQuestion(newQuestion: NewQuestion): Promise<Question> {
    // 수강 여부 확인
    const enrollment = await this.enrollmentRepository.findByUserIdAndCourseId(
      newQuestion.userId,
      newQuestion.courseId,
    );
    if (!enrollment) {
      throw new ForbiddenException('수강 중인 강의에만 질문을 작성할 수 있습니다.');
    }

    return this.questionRepository.save(newQuestion);
  }

  /**
   * 질문 수정
   * - 작성자 본인 확인
   */
  async updateQuestion(updateQuestion: UpdateQuestion): Promise<Question> {
    const question = await this.questionRepository.findById(updateQuestion.id);
    if (!question) {
      throw new NotFoundException('질문을 찾을 수 없습니다.');
    }

    if (question.userId !== updateQuestion.userId) {
      throw new ForbiddenException('본인이 작성한 질문만 수정할 수 있습니다.');
    }

    return this.questionRepository.update(updateQuestion);
  }

  /**
   * 질문 삭제 (Soft Delete)
   */
  async deleteQuestion(questionId: string, userId: string): Promise<void> {
    const question = await this.questionRepository.findById(questionId);
    if (!question) {
      throw new NotFoundException('질문을 찾을 수 없습니다.');
    }

    if (question.userId !== userId) {
      throw new ForbiddenException('본인이 작성한 질문만 삭제할 수 있습니다.');
    }

    await this.questionRepository.delete(questionId);
  }

  /**
   * 질문 상세 조회
   */
  async getQuestionById(questionId: string): Promise<Question> {
    const question = await this.questionRepository.findById(questionId);
    if (!question) {
      throw new NotFoundException('질문을 찾을 수 없습니다.');
    }

    return question;
  }

  /**
   * 강의별 질문 조회 (페이지네이션)
   */
  async getQuestionsByCourse(courseId: string, page: number, pageSize: number): Promise<QuestionListResult> {
    return this.questionRepository.findByCourseId(courseId, page, pageSize);
  }

  /**
   * 사용자별 질문 조회
   */
  async getQuestionsByUser(userId: string): Promise<Question[]> {
    return this.questionRepository.findByUserId(userId);
  }

  /**
   * 답변 작성
   * - 수강 여부 또는 강사 여부 확인
   */
  async createAnswer(newAnswer: NewAnswer): Promise<Answer> {
    const question = await this.questionRepository.findById(newAnswer.questionId);
    if (!question) {
      throw new NotFoundException('질문을 찾을 수 없습니다.');
    }

    // 수강생이거나 강사인지 확인
    const [enrollment, course] = await Promise.all([
      this.enrollmentRepository.findByUserIdAndCourseId(newAnswer.userId, question.courseId),
      this.courseRepository.findById(question.courseId),
    ]);

    const isEnrolled = !!enrollment;
    const isInstructor = course?.instructor.id === newAnswer.userId;

    if (!isEnrolled && !isInstructor) {
      throw new ForbiddenException('수강 중인 강의 또는 본인이 강의하는 강의에만 답변을 작성할 수 있습니다.');
    }

    return this.questionRepository.saveAnswer(newAnswer);
  }

  /**
   * 답변 수정
   * - 작성자 본인 확인
   */
  async updateAnswer(updateAnswer: UpdateAnswer): Promise<Answer> {
    const answer = await this.questionRepository.findAnswerById(updateAnswer.id);
    if (!answer) {
      throw new NotFoundException('답변을 찾을 수 없습니다.');
    }

    if (answer.userId !== updateAnswer.userId) {
      throw new ForbiddenException('본인이 작성한 답변만 수정할 수 있습니다.');
    }

    return this.questionRepository.updateAnswer(updateAnswer);
  }

  /**
   * 답변 삭제 (Soft Delete)
   */
  async deleteAnswer(answerId: string, userId: string): Promise<void> {
    const answer = await this.questionRepository.findAnswerById(answerId);
    if (!answer) {
      throw new NotFoundException('답변을 찾을 수 없습니다.');
    }

    if (answer.userId !== userId) {
      throw new ForbiddenException('본인이 작성한 답변만 삭제할 수 있습니다.');
    }

    await this.questionRepository.deleteAnswer(answerId);
  }

  /**
   * 질문에 달린 답변 목록 조회
   */
  async getAnswersByQuestion(questionId: string): Promise<Answer[]> {
    const question = await this.questionRepository.findById(questionId);
    if (!question) {
      throw new NotFoundException('질문을 찾을 수 없습니다.');
    }

    return this.questionRepository.findAnswersByQuestionId(questionId);
  }
}
