export class UpdateLecture {
  id: string;
  title?: string;
  description?: string;
  order?: number;
  duration?: number;
  videoUrl?: string;
  isPreview?: boolean;

  constructor(
    id: string,
    options?: {
      title?: string;
      description?: string;
      order?: number;
      duration?: number;
      videoUrl?: string;
      isPreview?: boolean;
    },
  ) {
    this.id = id;
    this.title = options?.title;
    this.description = options?.description;
    this.order = options?.order;
    this.duration = options?.duration;
    this.videoUrl = options?.videoUrl;
    this.isPreview = options?.isPreview;
  }
}
