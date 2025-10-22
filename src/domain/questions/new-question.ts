export class NewQuestion {
  constructor(
    public readonly title: string,
    public readonly content: string,
    public readonly userId: string,
    public readonly courseId: string,
  ) {}
}
