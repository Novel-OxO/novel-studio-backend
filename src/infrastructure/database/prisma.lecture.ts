import { Injectable } from '@nestjs/common';

import { Lecture } from '@/domain/lectures/lecture';
import { ILectureRepository } from '@/domain/lectures/lecture.repository';
import { NewLecture } from '@/domain/lectures/new-lecture';
import { UpdateLecture } from '@/domain/lectures/update-lecture';

import { PrismaService } from './prisma.service';

@Injectable()
export class PrismaLectureRepository implements ILectureRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(lecture: NewLecture): Promise<Lecture> {
    const createdLecture = await this.prisma.lecture.create({
      data: {
        title: lecture.title,
        description: lecture.description,
        order: lecture.order,
        duration: lecture.duration,
        isPreview: lecture.isPreview,
        sectionId: lecture.sectionId,
        courseId: lecture.courseId,
        videoStorageInfo: lecture.videoStorageInfo,
      },
    });

    return new Lecture(
      createdLecture.id,
      createdLecture.title,
      createdLecture.description,
      createdLecture.order,
      createdLecture.duration,
      createdLecture.isPreview,
      createdLecture.sectionId,
      createdLecture.courseId,
      createdLecture.videoStorageInfo,
      createdLecture.createdAt,
      createdLecture.updatedAt,
      createdLecture.deletedAt,
    );
  }

  async update(lecture: UpdateLecture): Promise<Lecture> {
    const updatedLecture = await this.prisma.lecture.update({
      where: {
        id: lecture.id,
      },
      data: {
        title: lecture.title,
        description: lecture.description,
        order: lecture.order,
        duration: lecture.duration,
        isPreview: lecture.isPreview,
        videoStorageInfo: lecture.videoStorageInfo,
      },
    });

    return new Lecture(
      updatedLecture.id,
      updatedLecture.title,
      updatedLecture.description,
      updatedLecture.order,
      updatedLecture.duration,
      updatedLecture.isPreview,
      updatedLecture.sectionId,
      updatedLecture.courseId,
      updatedLecture.videoStorageInfo,
      updatedLecture.createdAt,
      updatedLecture.updatedAt,
      updatedLecture.deletedAt,
    );
  }

  async delete(id: string): Promise<void> {
    await this.prisma.lecture.update({
      where: {
        id,
      },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  async findById(id: string): Promise<Lecture | null> {
    const lecture = await this.prisma.lecture.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!lecture) {
      return null;
    }

    return new Lecture(
      lecture.id,
      lecture.title,
      lecture.description,
      lecture.order,
      lecture.duration,
      lecture.isPreview,
      lecture.sectionId,
      lecture.courseId,
      lecture.videoStorageInfo,
      lecture.createdAt,
      lecture.updatedAt,
      lecture.deletedAt,
    );
  }

  async findBySectionId(sectionId: string): Promise<Lecture[]> {
    const lectures = await this.prisma.lecture.findMany({
      where: {
        sectionId,
        deletedAt: null,
      },
      orderBy: {
        order: 'asc',
      },
    });

    return lectures.map(
      (lecture) =>
        new Lecture(
          lecture.id,
          lecture.title,
          lecture.description,
          lecture.order,
          lecture.duration,
          lecture.isPreview,
          lecture.sectionId,
          lecture.courseId,
          lecture.videoStorageInfo,
          lecture.createdAt,
          lecture.updatedAt,
          lecture.deletedAt,
        ),
    );
  }

  async findByCourseId(courseId: string): Promise<Lecture[]> {
    const lectures = await this.prisma.lecture.findMany({
      where: {
        courseId,
        deletedAt: null,
      },
      orderBy: {
        order: 'asc',
      },
    });

    return lectures.map(
      (lecture) =>
        new Lecture(
          lecture.id,
          lecture.title,
          lecture.description,
          lecture.order,
          lecture.duration,
          lecture.isPreview,
          lecture.sectionId,
          lecture.courseId,
          lecture.videoStorageInfo,
          lecture.createdAt,
          lecture.updatedAt,
          lecture.deletedAt,
        ),
    );
  }
}
