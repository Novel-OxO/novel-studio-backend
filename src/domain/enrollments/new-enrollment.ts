export class NewEnrollment {
  constructor(
    public readonly userId: string,
    public readonly courseId: string,
    public readonly expiresAt: Date | null = null, // null이면 평생 수강
  ) {}
}
