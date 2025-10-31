import { Injectable } from '@nestjs/common';

import { Enrollment } from '@/domain/enrollments/enrollment';
import { type IEnrollmentRepository } from '@/domain/enrollments/enrollment.repository';
import { LectureProgress } from '@/domain/enrollments/lecture-progress';
import { NewEnrollment } from '@/domain/enrollments/new-enrollment';
import { UpdateLectureProgress } from '@/domain/enrollments/update-lecture-progress';

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

  async updateLectureProgress(enrollmentId: string, update: UpdateLectureProgress): Promise<LectureProgress> {
    const progress = await this.prisma.lectureProgress.upsert({
      where: {
        enrollmentId_lectureId: {
          enrollmentId,
          lectureId: update.lectureId,
        },
      },
      update: {
        watchTime: update.watchTime,
        isCompleted: update.isCompleted,
        completedAt: update.isCompleted ? new Date() : null,
      },
      create: {
        enrollmentId,
        lectureId: update.lectureId,
        watchTime: update.watchTime,
        isCompleted: update.isCompleted,
        completedAt: update.isCompleted ? new Date() : null,
      },
    });

    return this.toLectureProgressEntity(progress);
  }

  async findLectureProgressByEnrollmentId(enrollmentId: string): Promise<LectureProgress[]> {
    const progresses = await this.prisma.lectureProgress.findMany({
      where: { enrollmentId },
      orderBy: { createdAt: 'asc' },
    });

    return progresses.map((p) => this.toLectureProgressEntity(p));
  }

  async findLectureProgress(enrollmentId: string, lectureId: string): Promise<LectureProgress | null> {
    const progress = await this.prisma.lectureProgress.findUnique({
      where: {
        enrollmentId_lectureId: {
          enrollmentId,
          lectureId,
        },
      },
    });

    return progress ? this.toLectureProgressEntity(progress) : null;
  }

  async updateEnrollmentProgress(enrollmentId: string, progress: number): Promise<Enrollment> {
    const updated = await this.prisma.enrollment.update({
      where: { id: enrollmentId },
      data: {
        progress,
        lastAccessedAt: new Date(),
        isCompleted: progress === 100,
        completedAt: progress === 100 ? new Date() : null,
      },
    });

    return this.toEntity(updated);
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

  private toLectureProgressEntity(progress: any): LectureProgress {
    return new LectureProgress(
      progress.id,
      progress.enrollmentId,
      progress.lectureId,
      progress.watchTime,
      progress.isCompleted,
      progress.completedAt,
      progress.createdAt,
      progress.updatedAt,
    );
  }
}
