export class NewReviewReply {
  constructor(
    public readonly content: string,
    public readonly reviewId: string,
    public readonly userId: string,
  ) {}
}
