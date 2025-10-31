import { Enrollment } from './enrollment';
import { LectureProgress } from './lecture-progress';
import { NewEnrollment } from './new-enrollment';
import { UpdateLectureProgress } from './update-lecture-progress';

export const ENROLLMENT_REPOSITORY = Symbol('ENROLLMENT_REPOSITORY');

export interface IEnrollmentRepository {
  save(enrollment: NewEnrollment): Promise<Enrollment>;
  findById(id: string): Promise<Enrollment | null>;
  findByUserIdAndCourseId(userId: string, courseId: string): Promise<Enrollment | null>;
  findAllByUserId(userId: string): Promise<Enrollment[]>;
  findAllByCourseId(courseId: string): Promise<Enrollment[]>;
  exists(userId: string, courseId: string): Promise<boolean>;

  // LectureProgress 관련
  updateLectureProgress(enrollmentId: string, update: UpdateLectureProgress): Promise<LectureProgress>;
  findLectureProgressByEnrollmentId(enrollmentId: string): Promise<LectureProgress[]>;
  findLectureProgress(enrollmentId: string, lectureId: string): Promise<LectureProgress | null>;

  // Enrollment 전체 진행률 업데이트
  updateEnrollmentProgress(enrollmentId: string, progress: number): Promise<Enrollment>;
}
