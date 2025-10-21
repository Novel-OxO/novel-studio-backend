export class NewOrderItem {
  courseId: string;
  courseTitle: string;
  courseSlug: string;
  courseThumbnail: string | null;
  price: number;

  constructor(
    courseId: string,
    courseTitle: string,
    courseSlug: string,
    courseThumbnail: string | null,
    price: number,
  ) {
    this.courseId = courseId;
    this.courseTitle = courseTitle;
    this.courseSlug = courseSlug;
    this.courseThumbnail = courseThumbnail;
    this.price = price;
  }
}
