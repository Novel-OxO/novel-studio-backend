export class NewAnswer {
  constructor(
    public readonly content: string,
    public readonly userId: string,
    public readonly questionId: string,
  ) {}
}
