export class UpdateReview {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly rating?: number,
    public readonly title?: string,
    public readonly content?: string,
  ) {}
}
