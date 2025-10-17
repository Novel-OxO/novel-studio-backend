import { NewSection } from './new-section';
import { Section } from './section';
import { UpdateSection } from './update-section';

export const SECTION_REPOSITORY = Symbol('SECTION_REPOSITORY');

export interface ISectionRepository {
  save(section: NewSection): Promise<Section>;
  update(section: UpdateSection): Promise<Section>;
  delete(id: string): Promise<void>;
  findById(id: string): Promise<Section | null>;
  findByCourseId(courseId: string): Promise<Section[]>;
  reorderSections(courseId: string, sectionOrders: { id: string; order: number }[]): Promise<void>;
}
