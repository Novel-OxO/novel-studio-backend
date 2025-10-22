import { ReviewReply } from '@/domain/reviews/review-reply';

export class ReviewReplyResponse {
  id: string;
  content: string;
  reviewId: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;

  static from(reply: ReviewReply): ReviewReplyResponse {
    const response = new ReviewReplyResponse();
    response.id = reply.id;
    response.content = reply.content;
    response.reviewId = reply.reviewId;
    response.userId = reply.userId;
    response.createdAt = reply.createdAt;
    response.updatedAt = reply.updatedAt;
    return response;
  }
}
