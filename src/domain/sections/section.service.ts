import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import { COURSE_REPOSITORY, type ICourseRepository } from '@/domain/courses/course.repository';

import { NewSection } from './new-section';
import { Section } from './section';
import { SECTION_REPOSITORY, type ISectionRepository } from './section.repository';
import { UpdateSection } from './update-section';

@Injectable()
export class SectionService {
  constructor(
    @Inject(SECTION_REPOSITORY)
    private readonly sectionRepository: ISectionRepository,
    @Inject(COURSE_REPOSITORY)
    private readonly courseRepository: ICourseRepository,
  ) {}

  async createSection(newSection: NewSection): Promise<Section> {
    // 코스 존재 여부 확인
    const course = await this.courseRepository.findById(newSection.courseId);
    if (!course) {
      throw new NotFoundException('코스를 찾을 수 없습니다.');
    }

    return await this.sectionRepository.save(newSection);
  }

  async updateSection(updateSection: UpdateSection): Promise<Section> {
    // 섹션 존재 여부 확인
    const existingSection = await this.sectionRepository.findById(updateSection.id);
    if (!existingSection) {
      throw new NotFoundException('섹션을 찾을 수 없습니다.');
    }

    return await this.sectionRepository.update(updateSection);
  }

  async deleteSection(id: string): Promise<void> {
    // 섹션 존재 여부 확인
    const existingSection = await this.sectionRepository.findById(id);
    if (!existingSection) {
      throw new NotFoundException('섹션을 찾을 수 없습니다.');
    }

    await this.sectionRepository.delete(id);
  }
}
