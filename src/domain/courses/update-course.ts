import { CourseLevel, CourseStatus } from '@prisma/client';

export class UpdateCourse {
  id: string;
  slug?: string;
  title?: string;
  description?: string;
  thumbnailUrl?: string | null;
  price?: number;
  level?: CourseLevel;
  status?: CourseStatus;

  constructor(
    id: string,
    options?: {
      slug?: string;
      title?: string;
      description?: string;
      thumbnailUrl?: string | null;
      price?: number;
      level?: CourseLevel;
      status?: CourseStatus;
    },
  ) {
    this.id = id;
    this.slug = options?.slug;
    this.title = options?.title;
    this.description = options?.description;
    this.thumbnailUrl = options?.thumbnailUrl;
    this.price = options?.price;
    this.level = options?.level;
    this.status = options?.status;
  }
}
