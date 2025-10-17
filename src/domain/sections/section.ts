export class Section {
  id: string;
  title: string;
  order: number;
  courseId: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;

  constructor(
    id: string,
    title: string,
    order: number,
    courseId: string,
    createdAt: Date,
    updatedAt: Date,
    deletedAt: Date | null,
  ) {
    this.id = id;
    this.title = title;
    this.order = order;
    this.courseId = courseId;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.deletedAt = deletedAt;
  }
}
