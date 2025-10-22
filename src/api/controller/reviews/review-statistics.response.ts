import { ReviewStatistics } from '@/domain/reviews/review.repository';

export class ReviewStatisticsResponse {
  averageRating: number;
  totalCount: number;
  ratingDistribution: {
    rating: number;
    count: number;
  }[];

  static from(statistics: ReviewStatistics): ReviewStatisticsResponse {
    const response = new ReviewStatisticsResponse();
    response.averageRating = statistics.averageRating;
    response.totalCount = statistics.totalCount;
    response.ratingDistribution = statistics.ratingDistribution;
    return response;
  }
}
