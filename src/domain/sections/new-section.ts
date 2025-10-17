export class NewSection {
  title: string;
  order: number;
  courseId: string;

  constructor(title: string, order: number, courseId: string) {
    this.title = title;
    this.order = order;
    this.courseId = courseId;
  }
}
