import { forwardRef, Module } from '@nestjs/common';

import { LectureController } from '@/api/controller/lectures/lecture.controller';

import { LECTURE_REPOSITORY } from '@/domain/lectures/lecture.repository';
import { LectureService } from '@/domain/lectures/lecture.service';

import { PrismaLectureRepository } from '@/infrastructure/database/prisma.lecture';

import { AuthModule } from './auth.module';
import { CourseModule } from './course.module';
import { PrismaModule } from './prisma.module';
import { SectionModule } from './section.module';

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => AuthModule),
    forwardRef(() => CourseModule),
    forwardRef(() => SectionModule),
  ],
  controllers: [LectureController],
  providers: [
    LectureService,
    {
      provide: LECTURE_REPOSITORY,
      useClass: PrismaLectureRepository,
    },
  ],
  exports: [LectureService, LECTURE_REPOSITORY],
})
export class LectureModule {}
