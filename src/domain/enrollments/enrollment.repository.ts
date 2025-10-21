import { Enrollment } from './enrollment';
import { NewEnrollment } from './new-enrollment';

export const ENROLLMENT_REPOSITORY = Symbol('ENROLLMENT_REPOSITORY');

export interface IEnrollmentRepository {
  save(enrollment: NewEnrollment): Promise<Enrollment>;
  findById(id: string): Promise<Enrollment | null>;
  findByUserIdAndCourseId(userId: string, courseId: string): Promise<Enrollment | null>;
  findAllByUserId(userId: string): Promise<Enrollment[]>;
  findAllByCourseId(courseId: string): Promise<Enrollment[]>;
  exists(userId: string, courseId: string): Promise<boolean>;
}
