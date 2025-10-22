export class ReviewReply {
  constructor(
    public readonly id: string,
    public readonly content: string,
    public readonly reviewId: string,
    public readonly userId: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly deletedAt: Date | null,
  ) {}
}
