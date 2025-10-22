import { NewReview } from './new-review';
import { NewReviewReply } from './new-review-reply';
import { Review } from './review';
import { ReviewReply } from './review-reply';
import { UpdateReview } from './update-review';
import { UpdateReviewReply } from './update-review-reply';

export const REVIEW_REPOSITORY = Symbol('REVIEW_REPOSITORY');

export interface ReviewStatistics {
  averageRating: number;
  totalCount: number;
  ratingDistribution: {
    rating: number;
    count: number;
  }[];
}

export interface ReviewListResult {
  reviews: Review[];
  totalCount: number;
}

export interface IReviewRepository {
  // Review operations
  findById(id: string): Promise<Review | null>;
  findByCourseId(courseId: string, page: number, pageSize: number): Promise<ReviewListResult>;
  findByUserId(userId: string): Promise<Review[]>;
  findByUserIdAndCourseId(userId: string, courseId: string): Promise<Review | null>;
  save(review: NewReview): Promise<Review>;
  update(review: UpdateReview): Promise<Review>;
  delete(id: string): Promise<void>;
  getStatisticsByCourseId(courseId: string): Promise<ReviewStatistics>;

  // ReviewReply operations
  findReplyById(id: string): Promise<ReviewReply | null>;
  findReplyByReviewId(reviewId: string): Promise<ReviewReply | null>;
  saveReply(reply: NewReviewReply): Promise<ReviewReply>;
  updateReply(reply: UpdateReviewReply): Promise<ReviewReply>;
  deleteReply(id: string): Promise<void>;
}
