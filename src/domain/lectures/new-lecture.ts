export class NewLecture {
  title: string;
  description: string | null;
  order: number;
  duration: number | null;
  videoUrl: string | null;
  isPreview: boolean;
  sectionId: string;
  courseId: string;

  constructor(
    title: string,
    order: number,
    sectionId: string,
    courseId: string,
    options?: {
      description?: string;
      duration?: number;
      videoUrl?: string;
      isPreview?: boolean;
    },
  ) {
    this.title = title;
    this.description = options?.description ?? null;
    this.order = order;
    this.duration = options?.duration ?? null;
    this.videoUrl = options?.videoUrl ?? null;
    this.isPreview = options?.isPreview ?? false;
    this.sectionId = sectionId;
    this.courseId = courseId;
  }
}
