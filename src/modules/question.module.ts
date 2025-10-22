import { forwardRef, Module } from '@nestjs/common';

import { QuestionController } from '@/api/controller/questions/question.controller';

import { QUESTION_REPOSITORY } from '@/domain/questions/question.repository';
import { QuestionService } from '@/domain/questions/question.service';

import { PrismaQuestionRepository } from '@/infrastructure/database/prisma.question';

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
  controllers: [QuestionController],
  providers: [
    QuestionService,
    {
      provide: QUESTION_REPOSITORY,
      useClass: PrismaQuestionRepository,
    },
  ],
  exports: [QuestionService, QUESTION_REPOSITORY],
})
export class QuestionModule {}
