import { UserRole } from '@/domain/users/user';

declare global {
  namespace Express {
    interface Request {
      user: {
        userId: string;
        role: UserRole;
      };
    }
  }
}

export {};
