export class UpdateLectureProgress {
  constructor(
    public readonly lectureId: string,
    public readonly watchTime: number,
    public readonly isCompleted: boolean,
  ) {}
}
