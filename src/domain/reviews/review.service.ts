import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { COURSE_REPOSITORY, type ICourseRepository } from '@/domain/courses/course.repository';
import { ENROLLMENT_REPOSITORY, type IEnrollmentRepository } from '@/domain/enrollments/enrollment.repository';

import { NewReview } from './new-review';
import { NewReviewReply } from './new-review-reply';
import { Review } from './review';
import { ReviewReply } from './review-reply';
import {
  REVIEW_REPOSITORY,
  type IReviewRepository,
  type ReviewListResult,
  type ReviewStatistics,
} from './review.repository';
import { UpdateReview } from './update-review';
import { UpdateReviewReply } from './update-review-reply';

@Injectable()
export class ReviewService {
  constructor(
    @Inject(REVIEW_REPOSITORY)
    private readonly reviewRepository: IReviewRepository,
    @Inject(ENROLLMENT_REPOSITORY)
    private readonly enrollmentRepository: IEnrollmentRepository,
    @Inject(COURSE_REPOSITORY)
    private readonly courseRepository: ICourseRepository,
  ) {}

  /**
   * 리뷰 작성
   * - 수강 여부 확인
   * - 중복 리뷰 확인
   * - 평점 유효성 검사 (1-5)
   */
  async createReview(newReview: NewReview): Promise<Review> {
    // 평점 유효성 검사
    if (newReview.rating < 1 || newReview.rating > 5) {
      throw new BadRequestException('평점은 1~5 사이의 값이어야 합니다.');
    }

    // 수강 여부 확인
    const enrollment = await this.enrollmentRepository.findByUserIdAndCourseId(newReview.userId, newReview.courseId);
    if (!enrollment) {
      throw new ForbiddenException('수강 중인 강의에만 리뷰를 작성할 수 있습니다.');
    }

    // 중복 리뷰 확인
    const existingReview = await this.reviewRepository.findByUserIdAndCourseId(newReview.userId, newReview.courseId);
    if (existingReview) {
      throw new ConflictException('이미 해당 강의에 대한 리뷰를 작성하셨습니다.');
    }

    return this.reviewRepository.save(newReview);
  }

  /**
   * 리뷰 수정
   * - 작성자 본인 확인
   */
  async updateReview(updateReview: UpdateReview): Promise<Review> {
    const review = await this.reviewRepository.findById(updateReview.id);
    if (!review) {
      throw new NotFoundException('리뷰를 찾을 수 없습니다.');
    }

    if (review.userId !== updateReview.userId) {
      throw new ForbiddenException('본인이 작성한 리뷰만 수정할 수 있습니다.');
    }

    // 평점 유효성 검사
    if (updateReview.rating !== undefined && (updateReview.rating < 1 || updateReview.rating > 5)) {
      throw new BadRequestException('평점은 1~5 사이의 값이어야 합니다.');
    }

    return this.reviewRepository.update(updateReview);
  }

  /**
   * 리뷰 삭제 (Soft Delete)
   */
  async deleteReview(reviewId: string, userId: string): Promise<void> {
    const review = await this.reviewRepository.findById(reviewId);
    if (!review) {
      throw new NotFoundException('리뷰를 찾을 수 없습니다.');
    }

    if (review.userId !== userId) {
      throw new ForbiddenException('본인이 작성한 리뷰만 삭제할 수 있습니다.');
    }

    await this.reviewRepository.delete(reviewId);
  }

  /**
   * 리뷰 상세 조회
   */
  async getReviewById(reviewId: string): Promise<Review> {
    const review = await this.reviewRepository.findById(reviewId);
    if (!review) {
      throw new NotFoundException('리뷰를 찾을 수 없습니다.');
    }

    return review;
  }

  /**
   * 강의별 리뷰 조회 (페이지네이션)
   */
  async getReviewsByCourse(courseId: string, page: number, pageSize: number): Promise<ReviewListResult> {
    return this.reviewRepository.findByCourseId(courseId, page, pageSize);
  }

  /**
   * 사용자별 리뷰 조회
   */
  async getReviewsByUser(userId: string): Promise<Review[]> {
    return this.reviewRepository.findByUserId(userId);
  }

  /**
   * 강의 리뷰 통계 조회
   */
  async getReviewStatistics(courseId: string): Promise<ReviewStatistics> {
    return this.reviewRepository.getStatisticsByCourseId(courseId);
  }

  /**
   * 리뷰 답글 작성
   * - 강사 여부 확인
   */
  async createReviewReply(newReply: NewReviewReply): Promise<ReviewReply> {
    const review = await this.reviewRepository.findById(newReply.reviewId);
    if (!review) {
      throw new NotFoundException('리뷰를 찾을 수 없습니다.');
    }

    // 강사 여부 확인
    const course = await this.courseRepository.findById(review.courseId);
    if (!course) {
      throw new NotFoundException('강의를 찾을 수 없습니다.');
    }

    if (course.instructor.id !== newReply.userId) {
      throw new ForbiddenException('강의를 만든 강사만 리뷰 답글을 작성할 수 있습니다.');
    }

    // 기존 답글이 있는지 확인 (1:1 관계)
    const existingReply = await this.reviewRepository.findReplyByReviewId(newReply.reviewId);
    if (existingReply) {
      throw new ConflictException('이미 해당 리뷰에 대한 답글이 존재합니다.');
    }

    return this.reviewRepository.saveReply(newReply);
  }

  /**
   * 리뷰 답글 수정
   * - 작성자 본인 확인
   */
  async updateReviewReply(updateReply: UpdateReviewReply): Promise<ReviewReply> {
    const reply = await this.reviewRepository.findReplyById(updateReply.id);
    if (!reply) {
      throw new NotFoundException('답글을 찾을 수 없습니다.');
    }

    if (reply.userId !== updateReply.userId) {
      throw new ForbiddenException('본인이 작성한 답글만 수정할 수 있습니다.');
    }

    return this.reviewRepository.updateReply(updateReply);
  }

  /**
   * 리뷰 답글 삭제 (Soft Delete)
   */
  async deleteReviewReply(replyId: string, userId: string): Promise<void> {
    const reply = await this.reviewRepository.findReplyById(replyId);
    if (!reply) {
      throw new NotFoundException('답글을 찾을 수 없습니다.');
    }

    if (reply.userId !== userId) {
      throw new ForbiddenException('본인이 작성한 답글만 삭제할 수 있습니다.');
    }

    await this.reviewRepository.deleteReply(replyId);
  }

  /**
   * 리뷰에 대한 답글 조회
   */
  async getReplyByReviewId(reviewId: string): Promise<ReviewReply | null> {
    return this.reviewRepository.findReplyByReviewId(reviewId);
  }
}
