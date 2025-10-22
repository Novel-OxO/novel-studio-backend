export class UpdateAnswer {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly content: string,
  ) {}
}
