import { forwardRef, Module } from '@nestjs/common';

import { EnrollmentController } from '@/api/controller/enrollments/enrollment.controller';

import { ENROLLMENT_REPOSITORY } from '@/domain/enrollments/enrollment.repository';
import { EnrollmentService } from '@/domain/enrollments/enrollment.service';

import { PrismaEnrollmentRepository } from '@/infrastructure/database/prisma.enrollment';

import { AuthModule } from './auth.module';
import { CourseModule } from './course.module';
import { PrismaModule } from './prisma.module';

@Module({
  imports: [PrismaModule, CourseModule, forwardRef(() => AuthModule)],
  controllers: [EnrollmentController],
  providers: [
    {
      provide: ENROLLMENT_REPOSITORY,
      useClass: PrismaEnrollmentRepository,
    },
    EnrollmentService,
  ],
  exports: [ENROLLMENT_REPOSITORY, EnrollmentService],
})
export class EnrollmentModule {}
