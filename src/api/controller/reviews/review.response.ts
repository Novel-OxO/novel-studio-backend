import { Review } from '@/domain/reviews/review';

export class ReviewResponse {
  id: string;
  rating: number;
  title: string;
  content: string;
  userId: string;
  courseId: string;
  createdAt: Date;
  updatedAt: Date;

  static from(review: Review): ReviewResponse {
    const response = new ReviewResponse();
    response.id = review.id;
    response.rating = review.rating;
    response.title = review.title;
    response.content = review.content;
    response.userId = review.userId;
    response.courseId = review.courseId;
    response.createdAt = review.createdAt;
    response.updatedAt = review.updatedAt;
    return response;
  }
}
