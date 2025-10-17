import { Course } from './course';
import { NewCourse } from './new-course';

export const COURSE_REPOSITORY = Symbol('COURSE_REPOSITORY');

export interface ICourseRepository {
  save(course: NewCourse): Promise<Course>;
  findById(id: string): Promise<Course | null>;
  findBySlug(slug: string): Promise<Course | null>;
}
