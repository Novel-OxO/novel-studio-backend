import { CourseLevel, CourseStatus } from '@prisma/client';

import { Course } from './course';
import { NewCourse } from './new-course';
import { UpdateCourse } from './update-course';

export const COURSE_REPOSITORY = Symbol('COURSE_REPOSITORY');

export interface CourseFilter {
  status?: CourseStatus;
  level?: CourseLevel;
}

export interface CourseListResult {
  courses: Course[];
  totalCount: number;
}

export interface CourseIncludeOptions {
  includeSections?: boolean;
  includeLectures?: boolean;
}

export interface ICourseRepository {
  save(course: NewCourse): Promise<Course>;
  update(course: UpdateCourse): Promise<Course>;
  delete(id: string): Promise<void>;
  findById(id: string, options?: CourseIncludeOptions): Promise<Course | null>;
  findBySlug(slug: string): Promise<Course | null>;
  findAll(page: number, pageSize: number, filter?: CourseFilter): Promise<CourseListResult>;
}
