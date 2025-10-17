import { NewUser } from './new-user';
import { User } from './user';

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

export interface IUserRepository {
  save(user: NewUser): Promise<User>;
  findByEmail(email: string): Promise<User | null>;
}
