import { UserRole } from '@/domain/users/user';

export class TokenPayload {
  userId: string;
  role: UserRole;

  constructor(userId: string, role: UserRole) {
    this.userId = userId;
    this.role = role;
  }
}
