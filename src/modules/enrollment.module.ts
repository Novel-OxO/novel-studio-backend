import { Module } from '@nestjs/common';

import { ENROLLMENT_REPOSITORY } from '@/domain/enrollments/enrollment.repository';

import { PrismaEnrollmentRepository } from '@/infrastructure/database/prisma.enrollment';

import { PrismaModule } from './prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [
    {
      provide: ENROLLMENT_REPOSITORY,
      useClass: PrismaEnrollmentRepository,
    },
  ],
  exports: [ENROLLMENT_REPOSITORY],
})
export class EnrollmentModule {}
