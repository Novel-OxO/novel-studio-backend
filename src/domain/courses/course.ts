import { CourseLevel, CourseStatus } from '@prisma/client';

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
  }
}
