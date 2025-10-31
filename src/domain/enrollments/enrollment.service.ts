import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';

import { Course } from '@/domain/courses/course';
import { COURSE_REPOSITORY, type ICourseRepository } from '@/domain/courses/course.repository';

import { Enrollment } from './enrollment';
import { ENROLLMENT_REPOSITORY, type IEnrollmentRepository } from './enrollment.repository';
import { LectureProgress } from './lecture-progress';
import { UpdateLectureProgress } from './update-lecture-progress';

export interface EnrollmentWithCourse {
  enrollment: Enrollment;
  course: Course;
}

@Injectable()
export class EnrollmentService {
  constructor(
    @Inject(ENROLLMENT_REPOSITORY)
    private readonly enrollmentRepository: IEnrollmentRepository,
    @Inject(COURSE_REPOSITORY)
    private readonly courseRepository: ICourseRepository,
  ) {}

  /**
   * 수강 중인 강의 목록 조회 (진행률 포함)
   */
  async getEnrollmentsByUserId(userId: string): Promise<EnrollmentWithCourse[]> {
    const enrollments = await this.enrollmentRepository.findAllByUserId(userId);

    // 각 enrollment에 대해 course 정보를 가져옴
    const enrollmentsWithCourse = await Promise.all(
      enrollments.map(async (enrollment) => {
        const course = await this.courseRepository.findById(enrollment.courseId);

        if (!course) {
          throw new NotFoundException(`강의를 찾을 수 없습니다. (courseId: ${enrollment.courseId})`);
        }

        return {
          enrollment,
          course,
        };
      }),
    );

    return enrollmentsWithCourse;
  }

  /**
   * 특정 수강 정보 조회 (권한 체크 포함)
   */
  async getEnrollmentById(enrollmentId: string, userId: string): Promise<Enrollment> {
    const enrollment = await this.enrollmentRepository.findById(enrollmentId);

    if (!enrollment) {
      throw new NotFoundException('수강 정보를 찾을 수 없습니다.');
    }

    // 본인의 수강 정보인지 확인
    if (enrollment.userId !== userId) {
      throw new ForbiddenException('해당 수강 정보에 접근할 권한이 없습니다.');
    }

    return enrollment;
  }

  /**
   * 사용자가 특정 강의를 수강 중인지 확인
   */
  async getEnrollmentByCourseId(userId: string, courseId: string): Promise<Enrollment> {
    const enrollment = await this.enrollmentRepository.findByUserIdAndCourseId(userId, courseId);

    if (!enrollment) {
      throw new NotFoundException('해당 강의를 수강하고 있지 않습니다.');
    }

    return enrollment;
  }

  /**
   * 강의별 진행률 조회
   */
  async getLectureProgressByEnrollmentId(enrollmentId: string, userId: string): Promise<LectureProgress[]> {
    // 본인의 수강 정보인지 확인
    await this.getEnrollmentById(enrollmentId, userId);

    return await this.enrollmentRepository.findLectureProgressByEnrollmentId(enrollmentId);
  }

  /**
   * 수강 진행률 업데이트 (lectureId, watchTime, isCompleted)
   */
  async updateProgress(
    enrollmentId: string,
    userId: string,
    update: UpdateLectureProgress,
  ): Promise<{
    lectureProgress: LectureProgress;
    enrollment: Enrollment;
  }> {
    // 본인의 수강 정보인지 확인
    const enrollment = await this.getEnrollmentById(enrollmentId, userId);

    // LectureProgress 업데이트 (upsert)
    const lectureProgress = await this.enrollmentRepository.updateLectureProgress(enrollmentId, update);

    // 전체 진행률 재계산
    const course = await this.courseRepository.findById(enrollment.courseId, {
      includeLectures: true,
    });

    if (!course) {
      throw new NotFoundException(`강의를 찾을 수 없습니다. (courseId: ${enrollment.courseId})`);
    }

    const lectures = course.lectures || [];
    const totalLectures = lectures.length;
    if (totalLectures === 0) {
      // 강의가 없는 경우 진행률 0으로 설정
      const updatedEnrollment = await this.enrollmentRepository.updateEnrollmentProgress(enrollmentId, 0);
      return { lectureProgress, enrollment: updatedEnrollment };
    }

    // 완료된 강의 개수 계산
    const allProgresses = await this.enrollmentRepository.findLectureProgressByEnrollmentId(enrollmentId);
    const completedCount = allProgresses.filter((p) => p.isCompleted).length;

    // 진행률 계산 (0-100)
    const progressPercentage = Math.floor((completedCount / totalLectures) * 100);

    // Enrollment 진행률 업데이트
    const updatedEnrollment = await this.enrollmentRepository.updateEnrollmentProgress(
      enrollmentId,
      progressPercentage,
    );

    return {
      lectureProgress,
      enrollment: updatedEnrollment,
    };
  }
}
