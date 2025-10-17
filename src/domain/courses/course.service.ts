import { ConflictException, Inject, Injectable } from '@nestjs/common';

import { Course } from './course';
import { COURSE_REPOSITORY, type ICourseRepository } from './course.repository';
import { NewCourse } from './new-course';

@Injectable()
export class CourseService {
  constructor(
    @Inject(COURSE_REPOSITORY)
    private readonly courseRepository: ICourseRepository,
  ) {}

  async createCourse(newCourse: NewCourse): Promise<Course> {
    // slug 중복 체크
    const existingCourse = await this.courseRepository.findBySlug(newCourse.slug);

    if (existingCourse) {
      throw new ConflictException('이미 사용 중인 slug입니다.');
    }

    return await this.courseRepository.save(newCourse);
  }
}
