export class UpdateLecture {
  id: string;
  title?: string;
  description?: string;
  order?: number;
  duration?: number;
  isPreview?: boolean;
  videoStorageInfo?: any;

  constructor(
    id: string,
    options?: {
      title?: string;
      description?: string;
      order?: number;
      duration?: number;
      isPreview?: boolean;
      videoStorageInfo?: any;
    },
  ) {
    this.id = id;
    this.title = options?.title;
    this.description = options?.description;
    this.order = options?.order;
    this.duration = options?.duration;
    this.isPreview = options?.isPreview;
    this.videoStorageInfo = options?.videoStorageInfo;
  }
}
