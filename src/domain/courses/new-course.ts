import { CourseLevel, CourseStatus } from '@prisma/client';

export class NewCourse {
  slug: string;
  title: string;
  description: string;
  instructorId: string;
  thumbnailUrl?: string;
  price: number;
  level: CourseLevel;
  status: CourseStatus;

  constructor(
    slug: string,
    title: string,
    description: string,
    instructorId: string,
    options?: {
      thumbnailUrl?: string;
      price?: number;
      level?: CourseLevel;
      status?: CourseStatus;
    },
  ) {
    this.slug = slug;
    this.title = title;
    this.description = description;
    this.instructorId = instructorId;
    this.thumbnailUrl = options?.thumbnailUrl;
    this.price = options?.price ?? 0;
    this.level = options?.level ?? CourseLevel.BEGINNER;
    this.status = options?.status ?? CourseStatus.DRAFT;
  }
}
