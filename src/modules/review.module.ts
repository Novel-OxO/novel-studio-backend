import { forwardRef, Module } from '@nestjs/common';

import { ReviewController } from '@/api/controller/reviews/review.controller';

import { REVIEW_REPOSITORY } from '@/domain/reviews/review.repository';
import { ReviewService } from '@/domain/reviews/review.service';

import { PrismaReviewRepository } from '@/infrastructure/database/prisma.review';

import { AuthModule } from './auth.module';
import { CourseModule } from './course.module';
import { EnrollmentModule } from './enrollment.module';
import { PrismaModule } from './prisma.module';

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => AuthModule),
    forwardRef(() => EnrollmentModule),
    forwardRef(() => CourseModule),
  ],
  controllers: [ReviewController],
  providers: [
    ReviewService,
    {
      provide: REVIEW_REPOSITORY,
      useClass: PrismaReviewRepository,
    },
  ],
  exports: [ReviewService, REVIEW_REPOSITORY],
})
export class ReviewModule {}
