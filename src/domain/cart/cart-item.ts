import { Course } from '@/domain/courses/course';
import { User } from '@/domain/users/user';

export class CartItem {
  id: string;
  userId: string;
  courseId: string;
  user?: User;
  course?: Course;
  createdAt: Date;
  updatedAt: Date;

  constructor(
    id: string,
    userId: string,
    courseId: string,
    createdAt: Date,
    updatedAt: Date,
    user?: User,
    course?: Course,
  ) {
    this.id = id;
    this.userId = userId;
    this.courseId = courseId;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.user = user;
    this.course = course;
  }
}
