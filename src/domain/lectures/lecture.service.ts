import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';

import { COURSE_REPOSITORY, type ICourseRepository } from '@/domain/courses/course.repository';
import { SECTION_REPOSITORY, type ISectionRepository } from '@/domain/sections/section.repository';

import { Lecture } from './lecture';
import { LECTURE_REPOSITORY, type ILectureRepository } from './lecture.repository';
import { NewLecture } from './new-lecture';
import { UpdateLecture } from './update-lecture';

@Injectable()
export class LectureService {
  constructor(
    @Inject(LECTURE_REPOSITORY)
    private readonly lectureRepository: ILectureRepository,
    @Inject(SECTION_REPOSITORY)
    private readonly sectionRepository: ISectionRepository,
    @Inject(COURSE_REPOSITORY)
    private readonly courseRepository: ICourseRepository,
  ) {}

  async createLecture(newLecture: NewLecture): Promise<Lecture> {
    // 코스 존재 여부 확인
    const course = await this.courseRepository.findById(newLecture.courseId);
    if (!course) {
      throw new NotFoundException('코스를 찾을 수 없습니다.');
    }

    // 섹션 존재 여부 확인
    const section = await this.sectionRepository.findById(newLecture.sectionId);
    if (!section) {
      throw new NotFoundException('섹션을 찾을 수 없습니다.');
    }

    // 섹션이 해당 코스에 속하는지 확인
    if (section.courseId !== newLecture.courseId) {
      throw new BadRequestException('섹션이 해당 코스에 속하지 않습니다.');
    }

    return await this.lectureRepository.save(newLecture);
  }

  async updateLecture(updateLecture: UpdateLecture): Promise<Lecture> {
    // 강의 존재 여부 확인
    const existingLecture = await this.lectureRepository.findById(updateLecture.id);
    if (!existingLecture) {
      throw new NotFoundException('강의를 찾을 수 없습니다.');
    }

    return await this.lectureRepository.update(updateLecture);
  }

  async deleteLecture(id: string): Promise<void> {
    // 강의 존재 여부 확인
    const existingLecture = await this.lectureRepository.findById(id);
    if (!existingLecture) {
      throw new NotFoundException('강의를 찾을 수 없습니다.');
    }

    await this.lectureRepository.delete(id);
  }
}
