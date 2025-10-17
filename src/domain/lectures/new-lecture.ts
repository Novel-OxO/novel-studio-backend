export class NewLecture {
  title: string;
  description: string | null;
  order: number;
  duration: number | null;
  isPreview: boolean;
  sectionId: string;
  courseId: string;
  videoStorageInfo: any | null;

  constructor(
    title: string,
    order: number,
    sectionId: string,
    courseId: string,
    options?: {
      description?: string;
      duration?: number;
      isPreview?: boolean;
      videoStorageInfo?: any;
    },
  ) {
    this.title = title;
    this.description = options?.description ?? null;
    this.order = order;
    this.duration = options?.duration ?? null;
    this.isPreview = options?.isPreview ?? false;
    this.sectionId = sectionId;
    this.courseId = courseId;
    this.videoStorageInfo = options?.videoStorageInfo ?? null;
  }
}
