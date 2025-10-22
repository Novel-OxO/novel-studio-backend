export class NewReview {
  constructor(
    public readonly rating: number,
    public readonly title: string,
    public readonly content: string,
    public readonly userId: string,
    public readonly courseId: string,
  ) {}
}
