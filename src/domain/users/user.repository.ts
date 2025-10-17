import { NewUser } from './new-user';
import { UpdateUser } from './update-user';
import { User } from './user';

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

export interface IUserRepository {
  save(user: NewUser): Promise<User>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByEmailIncludingDeleted(email: string): Promise<User | null>;
  update(id: string, user: UpdateUser): Promise<User>;
  restore(id: string, user: NewUser): Promise<User>;
  softDelete(id: string): Promise<void>;
}
