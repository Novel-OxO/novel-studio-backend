import { UserRole } from '@/domain/users/user';

export class TokenPayload {
  userId: string;
  email: string;
  nickname: string;
  profileImageUrl: string | null;
  role: UserRole;

  constructor(userId: string, email: string, nickname: string, profileImageUrl: string | null, role: UserRole) {
    this.userId = userId;
    this.email = email;
    this.nickname = nickname;
    this.profileImageUrl = profileImageUrl;
    this.role = role;
  }
}
