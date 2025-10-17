import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';

import { Course } from './course';
import { COURSE_REPOSITORY, type ICourseRepository } from './course.repository';
import { NewCourse } from './new-course';
import { UpdateCourse } from './update-course';

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

  async updateCourse(updateCourse: UpdateCourse): Promise<Course> {
    // 코스 존재 여부 확인
    const existingCourse = await this.courseRepository.findById(updateCourse.id);

    if (!existingCourse) {
      throw new NotFoundException('코스를 찾을 수 없습니다.');
    }

    // slug를 변경하려는 경우 중복 체크
    if (updateCourse.slug && updateCourse.slug !== existingCourse.slug) {
      const courseWithSameSlug = await this.courseRepository.findBySlug(updateCourse.slug);

      if (courseWithSameSlug) {
        throw new ConflictException('이미 사용 중인 slug입니다.');
      }
    }

    return await this.courseRepository.update(updateCourse);
  }
}
