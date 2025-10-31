export class LectureProgress {
  constructor(
    public readonly id: string,
    public readonly enrollmentId: string,
    public readonly lectureId: string,
    public readonly watchTime: number,
    public readonly isCompleted: boolean,
    public readonly completedAt: Date | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
