import { ConflictException, Inject, Injectable } from '@nestjs/common';

import { PasswordEncoder } from '@/domain/auth/password-encoder';

import { NewUser } from './new-user';
import { User } from './user';
import { USER_REPOSITORY, type IUserRepository } from './user.repository';

@Injectable()
export class UserService {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    private readonly passwordEncoder: PasswordEncoder,
  ) {}

  async createUser(newUser: NewUser): Promise<User> {
    // 이메일 중복 체크
    const existingUser = await this.userRepository.findByEmail(newUser.email);
    if (existingUser) {
      throw new ConflictException('이미 사용 중인 이메일입니다.');
    }

    // 비밀번호 암호화
    const hashedPassword = await this.passwordEncoder.hashPassword(newUser.password);
    newUser.changePassword(hashedPassword);

    // 사용자 생성
    return await this.userRepository.save(newUser);
  }
}
