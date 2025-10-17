import { forwardRef, Module } from '@nestjs/common';

import { CourseController } from '@/api/controller/courses/course.controller';

import { COURSE_REPOSITORY } from '@/domain/courses/course.repository';
import { CourseService } from '@/domain/courses/course.service';

import { PrismaCourseRepository } from '@/infrastructure/database/prisma.course';

import { AuthModule } from './auth.module';
import { PrismaModule } from './prisma.module';

@Module({
  imports: [PrismaModule, forwardRef(() => AuthModule)],
  controllers: [CourseController],
  providers: [
    CourseService,
    {
      provide: COURSE_REPOSITORY,
      useClass: PrismaCourseRepository,
    },
  ],
  exports: [CourseService, COURSE_REPOSITORY],
})
export class CourseModule {}
