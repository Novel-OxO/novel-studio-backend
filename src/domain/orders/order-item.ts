export class OrderItem {
  id: string;
  orderId: string;
  courseId: string;
  courseTitle: string;
  courseSlug: string;
  courseThumbnail: string | null;
  price: number;
  createdAt: Date;

  constructor(
    id: string,
    orderId: string,
    courseId: string,
    courseTitle: string,
    courseSlug: string,
    courseThumbnail: string | null,
    price: number,
    createdAt: Date,
  ) {
    this.id = id;
    this.orderId = orderId;
    this.courseId = courseId;
    this.courseTitle = courseTitle;
    this.courseSlug = courseSlug;
    this.courseThumbnail = courseThumbnail;
    this.price = price;
    this.createdAt = createdAt;
  }
}
