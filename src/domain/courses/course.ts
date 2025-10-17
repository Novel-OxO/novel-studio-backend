import { CourseLevel, CourseStatus } from '@prisma/client';

import { Lecture } from '@/domain/lectures/lecture';
import { Section } from '@/domain/sections/section';
import { User } from '@/domain/users/user';

export class Course {
  id: string;
  slug: string;
  title: string;
  description: string;
  instructor: User;
  thumbnailUrl: string | null;
  price: number;
  level: CourseLevel;
  status: CourseStatus;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  sections?: Section[];
  lectures?: Lecture[];

  constructor(
    id: string,
    slug: string,
    title: string,
    description: string,
    instructor: User,
    thumbnailUrl: string | null,
    price: number,
    level: CourseLevel,
    status: CourseStatus,
    createdAt: Date,
    updatedAt: Date,
    deletedAt: Date | null,
    sections?: Section[],
    lectures?: Lecture[],
  ) {
    this.id = id;
    this.slug = slug;
    this.title = title;
    this.description = description;
    this.instructor = instructor;
    this.thumbnailUrl = thumbnailUrl;
    this.price = price;
    this.level = level;
    this.status = status;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.deletedAt = deletedAt;
    this.sections = sections;
    this.lectures = lectures;
  }
}
