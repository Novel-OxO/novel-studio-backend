export class Question {
  constructor(
    public readonly id: string,
    public readonly title: string,
    public readonly content: string,
    public readonly userId: string,
    public readonly courseId: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly deletedAt: Date | null,
  ) {}
}
