import { Injectable } from '@nestjs/common';

import { Course } from '@/domain/courses/course';
import { ICourseRepository } from '@/domain/courses/course.repository';
import { NewCourse } from '@/domain/courses/new-course';
import { UpdateCourse } from '@/domain/courses/update-course';
import { User, UserRole } from '@/domain/users/user';

import { PrismaService } from './prisma.service';

/**
 * Admin 유저는 절대로 회원 탈퇴 하지 않아서 그로 인해 데이터가 꼬일 일은 없음
 * 코스에 대한 삭제는 무조건 명시적으로 API에 호출을 해야함
 */
@Injectable()
export class PrismaCourseRepository implements ICourseRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(course: NewCourse): Promise<Course> {
    const createdCourse = await this.prisma.course.create({
      data: {
        slug: course.slug,
        title: course.title,
        description: course.description,
        instructorId: course.instructorId,
        thumbnailUrl: course.thumbnailUrl,
        price: course.price,
        level: course.level,
        status: course.status,
      },
      include: {
        instructor: true,
      },
    });

    const instructor = new User(
      createdCourse.instructor.id,
      createdCourse.instructor.email,
      createdCourse.instructor.hashedPassword,
      createdCourse.instructor.nickname,
      createdCourse.instructor.profileImageUrl,
      createdCourse.instructor.role as UserRole,
      createdCourse.instructor.createdAt,
      createdCourse.instructor.updatedAt,
      createdCourse.instructor.deletedAt,
    );

    return new Course(
      createdCourse.id,
      createdCourse.slug,
      createdCourse.title,
      createdCourse.description,
      instructor,
      createdCourse.thumbnailUrl,
      createdCourse.price,
      createdCourse.level,
      createdCourse.status,
      createdCourse.createdAt,
      createdCourse.updatedAt,
      createdCourse.deletedAt,
    );
  }

  async findById(id: string): Promise<Course | null> {
    const course = await this.prisma.course.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        instructor: true,
      },
    });

    if (!course) {
      return null;
    }

    const instructor = new User(
      course.instructor.id,
      course.instructor.email,
      course.instructor.hashedPassword,
      course.instructor.nickname,
      course.instructor.profileImageUrl,
      course.instructor.role as UserRole,
      course.instructor.createdAt,
      course.instructor.updatedAt,
      course.instructor.deletedAt,
    );

    return new Course(
      course.id,
      course.slug,
      course.title,
      course.description,
      instructor,
      course.thumbnailUrl,
      course.price,
      course.level,
      course.status,
      course.createdAt,
      course.updatedAt,
      course.deletedAt,
    );
  }

  async findBySlug(slug: string): Promise<Course | null> {
    const course = await this.prisma.course.findFirst({
      where: {
        slug,
        deletedAt: null,
      },
      include: {
        instructor: true,
      },
    });

    if (!course) {
      return null;
    }

    const instructor = new User(
      course.instructor.id,
      course.instructor.email,
      course.instructor.hashedPassword,
      course.instructor.nickname,
      course.instructor.profileImageUrl,
      course.instructor.role as UserRole,
      course.instructor.createdAt,
      course.instructor.updatedAt,
      course.instructor.deletedAt,
    );

    return new Course(
      course.id,
      course.slug,
      course.title,
      course.description,
      instructor,
      course.thumbnailUrl,
      course.price,
      course.level,
      course.status,
      course.createdAt,
      course.updatedAt,
      course.deletedAt,
    );
  }

  async update(course: UpdateCourse): Promise<Course> {
    const updatedCourse = await this.prisma.course.update({
      where: {
        id: course.id,
      },
      data: {
        slug: course.slug,
        title: course.title,
        description: course.description,
        thumbnailUrl: course.thumbnailUrl,
        price: course.price,
        level: course.level,
        status: course.status,
      },
      include: {
        instructor: true,
      },
    });

    const instructor = new User(
      updatedCourse.instructor.id,
      updatedCourse.instructor.email,
      updatedCourse.instructor.hashedPassword,
      updatedCourse.instructor.nickname,
      updatedCourse.instructor.profileImageUrl,
      updatedCourse.instructor.role as UserRole,
      updatedCourse.instructor.createdAt,
      updatedCourse.instructor.updatedAt,
      updatedCourse.instructor.deletedAt,
    );

    return new Course(
      updatedCourse.id,
      updatedCourse.slug,
      updatedCourse.title,
      updatedCourse.description,
      instructor,
      updatedCourse.thumbnailUrl,
      updatedCourse.price,
      updatedCourse.level,
      updatedCourse.status,
      updatedCourse.createdAt,
      updatedCourse.updatedAt,
      updatedCourse.deletedAt,
    );
  }
}
