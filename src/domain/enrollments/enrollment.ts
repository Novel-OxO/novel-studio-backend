export class Enrollment {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly courseId: string,
    public readonly enrolledAt: Date,
    public readonly expiresAt: Date | null,
    public readonly lastAccessedAt: Date | null,
    public readonly progress: number,
    public readonly isCompleted: boolean,
    public readonly completedAt: Date | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
