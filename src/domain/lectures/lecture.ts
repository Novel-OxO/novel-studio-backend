export class Lecture {
  id: string;
  title: string;
  description: string | null;
  order: number;
  duration: number | null;
  isPreview: boolean;
  sectionId: string;
  courseId: string;
  videoStorageInfo: any | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;

  constructor(
    id: string,
    title: string,
    description: string | null,
    order: number,
    duration: number | null,
    isPreview: boolean,
    sectionId: string,
    courseId: string,
    videoStorageInfo: unknown | null,
    createdAt: Date,
    updatedAt: Date,
    deletedAt: Date | null,
  ) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.order = order;
    this.duration = duration;
    this.isPreview = isPreview;
    this.sectionId = sectionId;
    this.courseId = courseId;
    this.videoStorageInfo = videoStorageInfo;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.deletedAt = deletedAt;
  }
}
