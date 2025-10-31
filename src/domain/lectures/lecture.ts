export class Lecture {
  id: string;
  title: string;
  description: string | null;
  order: number;
  duration: number | null;
  videoUrl: string | null;
  isPreview: boolean;
  sectionId: string;
  courseId: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;

  constructor(
    id: string,
    title: string,
    description: string | null,
    order: number,
    duration: number | null,
    videoUrl: string | null,
    isPreview: boolean,
    sectionId: string,
    courseId: string,
    createdAt: Date,
    updatedAt: Date,
    deletedAt: Date | null,
  ) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.order = order;
    this.duration = duration;
    this.videoUrl = videoUrl;
    this.isPreview = isPreview;
    this.sectionId = sectionId;
    this.courseId = courseId;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.deletedAt = deletedAt;
  }
}
