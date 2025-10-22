import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { AccessTokenGuard } from '@/api/controller/auth/access-token.guard';
import { CurrentUser, type CurrentUserPayload } from '@/api/controller/auth/current-user.decorator';
import {
  createPaginatedResponse,
  createSuccessResponse,
  type PaginatedResponse,
  type SuccessResponse,
} from '@/api/support/response';

import { NewReview } from '@/domain/reviews/new-review';
import { NewReviewReply } from '@/domain/reviews/new-review-reply';
import { ReviewService } from '@/domain/reviews/review.service';
import { UpdateReview } from '@/domain/reviews/update-review';
import { UpdateReviewReply } from '@/domain/reviews/update-review-reply';

import { CreateReviewReplyDto } from './dto/create-review-reply.dto';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewReplyDto } from './dto/update-review-reply.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { ReviewReplyResponse } from './review-reply.response';
import { ReviewStatisticsResponse } from './review-statistics.response';
import { ReviewResponse } from './review.response';

@ApiTags('reviews')
@Controller('reviews')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Post('courses/:courseId')
  @UseGuards(AccessTokenGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '리뷰 작성' })
  @ApiResponse({ status: HttpStatus.CREATED, description: '리뷰 작성 성공' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음 (수강생만 가능)' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: '중복 리뷰' })
  async createReview(
    @CurrentUser() user: CurrentUserPayload,
    @Param('courseId') courseId: string,
    @Body() dto: CreateReviewDto,
  ): Promise<SuccessResponse<ReviewResponse>> {
    const newReview = new NewReview(dto.rating, dto.title, dto.content, user.userId, courseId);
    const review = await this.reviewService.createReview(newReview);
    return createSuccessResponse(ReviewResponse.from(review));
  }

  @Get('courses/:courseId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '강의별 리뷰 목록 조회' })
  @ApiResponse({ status: HttpStatus.OK, description: '리뷰 목록 조회 성공' })
  async getReviews(
    @Param('courseId') courseId: string,
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 10,
  ): Promise<PaginatedResponse<ReviewResponse>> {
    const result = await this.reviewService.getReviewsByCourse(courseId, Number(page), Number(pageSize));
    return createPaginatedResponse(
      result.reviews.map((r) => ReviewResponse.from(r)),
      result.totalCount,
      Number(page),
      Number(pageSize),
    );
  }

  @Get('courses/:courseId/statistics')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '강의 리뷰 통계 조회' })
  @ApiResponse({ status: HttpStatus.OK, description: '리뷰 통계 조회 성공' })
  async getReviewStatistics(@Param('courseId') courseId: string): Promise<SuccessResponse<ReviewStatisticsResponse>> {
    const statistics = await this.reviewService.getReviewStatistics(courseId);
    return createSuccessResponse(ReviewStatisticsResponse.from(statistics));
  }

  @Get(':reviewId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '리뷰 상세 조회' })
  @ApiResponse({ status: HttpStatus.OK, description: '리뷰 조회 성공' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '리뷰를 찾을 수 없음' })
  async getReview(@Param('reviewId') reviewId: string): Promise<SuccessResponse<ReviewResponse>> {
    const review = await this.reviewService.getReviewById(reviewId);
    return createSuccessResponse(ReviewResponse.from(review));
  }

  @Patch(':reviewId')
  @UseGuards(AccessTokenGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '리뷰 수정' })
  @ApiResponse({ status: HttpStatus.OK, description: '리뷰 수정 성공' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음 (작성자만 가능)' })
  async updateReview(
    @CurrentUser() user: CurrentUserPayload,
    @Param('reviewId') reviewId: string,
    @Body() dto: UpdateReviewDto,
  ): Promise<SuccessResponse<ReviewResponse>> {
    const updateReview = new UpdateReview(reviewId, user.userId, dto.rating, dto.title, dto.content);
    const review = await this.reviewService.updateReview(updateReview);
    return createSuccessResponse(ReviewResponse.from(review));
  }

  @Delete(':reviewId')
  @UseGuards(AccessTokenGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '리뷰 삭제' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: '리뷰 삭제 성공' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음 (작성자만 가능)' })
  async deleteReview(@CurrentUser() user: CurrentUserPayload, @Param('reviewId') reviewId: string): Promise<void> {
    await this.reviewService.deleteReview(reviewId, user.userId);
  }

  @Post(':reviewId/reply')
  @UseGuards(AccessTokenGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '리뷰 답글 작성' })
  @ApiResponse({ status: HttpStatus.CREATED, description: '답글 작성 성공' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음 (강사만 가능)' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: '이미 답글이 존재함' })
  async createReviewReply(
    @CurrentUser() user: CurrentUserPayload,
    @Param('reviewId') reviewId: string,
    @Body() dto: CreateReviewReplyDto,
  ): Promise<SuccessResponse<ReviewReplyResponse>> {
    const newReply = new NewReviewReply(dto.content, reviewId, user.userId);
    const reply = await this.reviewService.createReviewReply(newReply);
    return createSuccessResponse(ReviewReplyResponse.from(reply));
  }

  @Get(':reviewId/reply')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '리뷰 답글 조회' })
  @ApiResponse({ status: HttpStatus.OK, description: '답글 조회 성공' })
  async getReviewReply(@Param('reviewId') reviewId: string): Promise<SuccessResponse<ReviewReplyResponse | null>> {
    const reply = await this.reviewService.getReplyByReviewId(reviewId);
    return createSuccessResponse(reply ? ReviewReplyResponse.from(reply) : null);
  }

  @Patch('replies/:replyId')
  @UseGuards(AccessTokenGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '리뷰 답글 수정' })
  @ApiResponse({ status: HttpStatus.OK, description: '답글 수정 성공' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음 (작성자만 가능)' })
  async updateReviewReply(
    @CurrentUser() user: CurrentUserPayload,
    @Param('replyId') replyId: string,
    @Body() dto: UpdateReviewReplyDto,
  ): Promise<SuccessResponse<ReviewReplyResponse>> {
    const updateReply = new UpdateReviewReply(replyId, user.userId, dto.content);
    const reply = await this.reviewService.updateReviewReply(updateReply);
    return createSuccessResponse(ReviewReplyResponse.from(reply));
  }

  @Delete('replies/:replyId')
  @UseGuards(AccessTokenGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '리뷰 답글 삭제' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: '답글 삭제 성공' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음 (작성자만 가능)' })
  async deleteReviewReply(@CurrentUser() user: CurrentUserPayload, @Param('replyId') replyId: string): Promise<void> {
    await this.reviewService.deleteReviewReply(replyId, user.userId);
  }
}
