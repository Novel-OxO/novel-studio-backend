import { Injectable } from '@nestjs/common';

import { NewSection } from '@/domain/sections/new-section';
import { Section } from '@/domain/sections/section';
import { ISectionRepository } from '@/domain/sections/section.repository';
import { UpdateSection } from '@/domain/sections/update-section';

import { PrismaService } from './prisma.service';

@Injectable()
export class PrismaSectionRepository implements ISectionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(section: NewSection): Promise<Section> {
    const createdSection = await this.prisma.section.create({
      data: {
        title: section.title,
        order: section.order,
        courseId: section.courseId,
      },
    });

    return new Section(
      createdSection.id,
      createdSection.title,
      createdSection.order,
      createdSection.courseId,
      createdSection.createdAt,
      createdSection.updatedAt,
      createdSection.deletedAt,
    );
  }

  async update(section: UpdateSection): Promise<Section> {
    const updatedSection = await this.prisma.section.update({
      where: {
        id: section.id,
      },
      data: {
        title: section.title,
        order: section.order,
      },
    });

    return new Section(
      updatedSection.id,
      updatedSection.title,
      updatedSection.order,
      updatedSection.courseId,
      updatedSection.createdAt,
      updatedSection.updatedAt,
      updatedSection.deletedAt,
    );
  }

  async delete(id: string): Promise<void> {
    await this.prisma.section.update({
      where: {
        id,
      },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  async findById(id: string): Promise<Section | null> {
    const section = await this.prisma.section.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!section) {
      return null;
    }

    return new Section(
      section.id,
      section.title,
      section.order,
      section.courseId,
      section.createdAt,
      section.updatedAt,
      section.deletedAt,
    );
  }

  async findByCourseId(courseId: string): Promise<Section[]> {
    const sections = await this.prisma.section.findMany({
      where: {
        courseId,
        deletedAt: null,
      },
      orderBy: {
        order: 'asc',
      },
    });

    return sections.map(
      (section) =>
        new Section(
          section.id,
          section.title,
          section.order,
          section.courseId,
          section.createdAt,
          section.updatedAt,
          section.deletedAt,
        ),
    );
  }

  async reorderSections(courseId: string, sectionOrders: { id: string; order: number }[]): Promise<void> {
    await this.prisma.$transaction(
      sectionOrders.map(({ id, order }) =>
        this.prisma.section.update({
          where: { id, courseId },
          data: { order },
        }),
      ),
    );
  }
}
