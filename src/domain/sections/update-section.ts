export class UpdateSection {
  id: string;
  title?: string;
  order?: number;

  constructor(
    id: string,
    options?: {
      title?: string;
      order?: number;
    },
  ) {
    this.id = id;
    this.title = options?.title;
    this.order = options?.order;
  }
}
