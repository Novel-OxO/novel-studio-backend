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
    // 이메일 중복 체크 (삭제된 사용자 포함)
    const existingUser = await this.userRepository.findByEmailIncludingDeleted(newUser.email);

    if (existingUser) {
      // 활성 사용자가 존재하는 경우
      if (existingUser.deletedAt === null) {
        throw new ConflictException('이미 사용 중인 이메일입니다.');
      }

      // 삭제된 사용자가 존재하는 경우 - 재가입 처리
      const hashedPassword = await this.passwordEncoder.hashPassword(newUser.password);
      newUser.changePassword(hashedPassword);

      return await this.userRepository.restore(existingUser.id, newUser);
    }

    // 기존 사용자가 없는 경우 - 신규 가입
    const hashedPassword = await this.passwordEncoder.hashPassword(newUser.password);
    newUser.changePassword(hashedPassword);

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

  async deleteUser(userId: string): Promise<void> {
    // 사용자 존재 여부 확인
    const existingUser = await this.userRepository.findById(userId);
    if (!existingUser) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    // 소프트 삭제
    await this.userRepository.softDelete(userId);
  }
}
