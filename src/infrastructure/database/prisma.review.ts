import { Injectable } from '@nestjs/common';

import type { Review as PrismaReview, ReviewReply as PrismaReviewReply } from '@prisma/client';

import { NewReview } from '@/domain/reviews/new-review';
import { NewReviewReply } from '@/domain/reviews/new-review-reply';
import { Review } from '@/domain/reviews/review';
import { ReviewReply } from '@/domain/reviews/review-reply';
import {
  type IReviewRepository,
  type ReviewListResult,
  type ReviewStatistics,
} from '@/domain/reviews/review.repository';
import { UpdateReview } from '@/domain/reviews/update-review';
import { UpdateReviewReply } from '@/domain/reviews/update-review-reply';

import { PrismaService } from './prisma.service';

@Injectable()
export class PrismaReviewRepository implements IReviewRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toEntity(prismaReview: PrismaReview): Review {
    return new Review(
      prismaReview.id,
      prismaReview.rating,
      prismaReview.title,
      prismaReview.content,
      prismaReview.userId,
      prismaReview.courseId,
      prismaReview.createdAt,
      prismaReview.updatedAt,
      prismaReview.deletedAt,
    );
  }

  private toReplyEntity(prismaReply: PrismaReviewReply): ReviewReply {
    return new ReviewReply(
      prismaReply.id,
      prismaReply.content,
      prismaReply.reviewId,
      prismaReply.userId,
      prismaReply.createdAt,
      prismaReply.updatedAt,
      prismaReply.deletedAt,
    );
  }

  async findById(id: string): Promise<Review | null> {
    const review = await this.prisma.review.findFirst({
      where: { id, deletedAt: null },
    });

    return review ? this.toEntity(review) : null;
  }

  async findByCourseId(courseId: string, page: number, pageSize: number): Promise<ReviewListResult> {
    const skip = (page - 1) * pageSize;

    const [reviews, totalCount] = await Promise.all([
      this.prisma.review.findMany({
        where: { courseId, deletedAt: null },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.review.count({
        where: { courseId, deletedAt: null },
      }),
    ]);

    return {
      reviews: reviews.map((r) => this.toEntity(r)),
      totalCount,
    };
  }

  async findByUserId(userId: string): Promise<Review[]> {
    const reviews = await this.prisma.review.findMany({
      where: { userId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    return reviews.map((r) => this.toEntity(r));
  }

  async findByUserIdAndCourseId(userId: string, courseId: string): Promise<Review | null> {
    const review = await this.prisma.review.findFirst({
      where: { userId, courseId, deletedAt: null },
    });

    return review ? this.toEntity(review) : null;
  }

  async save(newReview: NewReview): Promise<Review> {
    const review = await this.prisma.review.create({
      data: {
        rating: newReview.rating,
        title: newReview.title,
        content: newReview.content,
        userId: newReview.userId,
        courseId: newReview.courseId,
      },
    });

    return this.toEntity(review);
  }

  async update(updateReview: UpdateReview): Promise<Review> {
    const data: {
      rating?: number;
      title?: string;
      content?: string;
    } = {};

    if (updateReview.rating !== undefined) data.rating = updateReview.rating;
    if (updateReview.title !== undefined) data.title = updateReview.title;
    if (updateReview.content !== undefined) data.content = updateReview.content;

    const review = await this.prisma.review.update({
      where: { id: updateReview.id },
      data,
    });

    return this.toEntity(review);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.review.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async getStatisticsByCourseId(courseId: string): Promise<ReviewStatistics> {
    const reviews = await this.prisma.review.findMany({
      where: { courseId, deletedAt: null },
      select: { rating: true },
    });

    const totalCount = reviews.length;
    const averageRating = totalCount > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalCount : 0;

    // 평점별 분포 계산
    const distribution = new Map<number, number>();
    for (let i = 1; i <= 5; i++) {
      distribution.set(i, 0);
    }

    reviews.forEach((r) => {
      distribution.set(r.rating, (distribution.get(r.rating) || 0) + 1);
    });

    const ratingDistribution = Array.from(distribution.entries())
      .map(([rating, count]) => ({ rating, count }))
      .sort((a, b) => b.rating - a.rating);

    return {
      averageRating: Math.round(averageRating * 10) / 10, // 소수점 첫째 자리까지
      totalCount,
      ratingDistribution,
    };
  }

  // ReviewReply operations

  async findReplyById(id: string): Promise<ReviewReply | null> {
    const reply = await this.prisma.reviewReply.findFirst({
      where: { id, deletedAt: null },
    });

    return reply ? this.toReplyEntity(reply) : null;
  }

  async findReplyByReviewId(reviewId: string): Promise<ReviewReply | null> {
    const reply = await this.prisma.reviewReply.findFirst({
      where: { reviewId, deletedAt: null },
    });

    return reply ? this.toReplyEntity(reply) : null;
  }

  async saveReply(newReply: NewReviewReply): Promise<ReviewReply> {
    const reply = await this.prisma.reviewReply.create({
      data: {
        content: newReply.content,
        reviewId: newReply.reviewId,
        userId: newReply.userId,
      },
    });

    return this.toReplyEntity(reply);
  }

  async updateReply(updateReply: UpdateReviewReply): Promise<ReviewReply> {
    const reply = await this.prisma.reviewReply.update({
      where: { id: updateReply.id },
      data: { content: updateReply.content },
    });

    return this.toReplyEntity(reply);
  }

  async deleteReply(id: string): Promise<void> {
    await this.prisma.reviewReply.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
