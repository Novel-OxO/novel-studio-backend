import { Injectable } from '@nestjs/common';

import { Enrollment } from '@/domain/enrollments/enrollment';
import { type IEnrollmentRepository } from '@/domain/enrollments/enrollment.repository';
import { NewEnrollment } from '@/domain/enrollments/new-enrollment';

import { PrismaService } from './prisma.service';

@Injectable()
export class PrismaEnrollmentRepository implements IEnrollmentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(newEnrollment: NewEnrollment): Promise<Enrollment> {
    const created = await this.prisma.enrollment.create({
      data: {
        userId: newEnrollment.userId,
        courseId: newEnrollment.courseId,
        expiresAt: newEnrollment.expiresAt,
      },
    });

    return this.toEntity(created);
  }

  async findById(id: string): Promise<Enrollment | null> {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id },
    });

    return enrollment ? this.toEntity(enrollment) : null;
  }

  async findByUserIdAndCourseId(userId: string, courseId: string): Promise<Enrollment | null> {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
    });

    return enrollment ? this.toEntity(enrollment) : null;
  }

  async findAllByUserId(userId: string): Promise<Enrollment[]> {
    const enrollments = await this.prisma.enrollment.findMany({
      where: { userId },
      orderBy: { enrolledAt: 'desc' },
    });

    return enrollments.map((e) => this.toEntity(e));
  }

  async findAllByCourseId(courseId: string): Promise<Enrollment[]> {
    const enrollments = await this.prisma.enrollment.findMany({
      where: { courseId },
      orderBy: { enrolledAt: 'desc' },
    });

    return enrollments.map((e) => this.toEntity(e));
  }

  async exists(userId: string, courseId: string): Promise<boolean> {
    const count = await this.prisma.enrollment.count({
      where: {
        userId,
        courseId,
      },
    });

    return count > 0;
  }

  private toEntity(enrollment: any): Enrollment {
    return new Enrollment(
      enrollment.id,
      enrollment.userId,
      enrollment.courseId,
      enrollment.enrolledAt,
      enrollment.expiresAt,
      enrollment.lastAccessedAt,
      enrollment.progress,
      enrollment.isCompleted,
      enrollment.completedAt,
      enrollment.createdAt,
      enrollment.updatedAt,
    );
  }
}
