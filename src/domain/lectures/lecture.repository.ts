import { Lecture } from './lecture';
import { NewLecture } from './new-lecture';
import { UpdateLecture } from './update-lecture';

export const LECTURE_REPOSITORY = Symbol('LECTURE_REPOSITORY');

export interface ILectureRepository {
  save(lecture: NewLecture): Promise<Lecture>;
  update(lecture: UpdateLecture): Promise<Lecture>;
  delete(id: string): Promise<void>;
  findById(id: string): Promise<Lecture | null>;
  findBySectionId(sectionId: string): Promise<Lecture[]>;
  findByCourseId(courseId: string): Promise<Lecture[]>;
}
