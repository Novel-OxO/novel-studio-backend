export class NewCartItem {
  userId: string;
  courseId: string;

  constructor(userId: string, courseId: string) {
    this.userId = userId;
    this.courseId = courseId;
  }
}
