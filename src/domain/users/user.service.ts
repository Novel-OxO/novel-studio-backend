import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';

import { PasswordEncoder } from '@/domain/auth/password-encoder';

import { NewUser } from './new-user';
import { UpdateUser } from './update-user';
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

  async updateUser(userId: string, updateUser: UpdateUser): Promise<User> {
    // 사용자 존재 여부 확인
    const existingUser = await this.userRepository.findById(userId);
    if (!existingUser) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    // 사용자 정보 업데이트
    return await this.userRepository.update(userId, updateUser);
  }
}
