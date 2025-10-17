import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';

import { USER_REPOSITORY, type IUserRepository } from '@/domain/users/user.repository';

import { PasswordEncoder } from './password-encoder';
import { Token } from './token';
import { TokenService } from './token.service';
import { UseCredential } from './use-credentail';

@Injectable()
export class AuthService {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    private readonly passwordEncoder: PasswordEncoder,
    private readonly tokenService: TokenService,
  ) {}

  async signIn(credential: UseCredential): Promise<Token> {
    // 이메일로 사용자 조회
    const user = await this.userRepository.findByEmail(credential.email);
    if (!user) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 일치하지 않습니다.');
    }

    // 비밀번호 검증
    const isPasswordValid = await this.passwordEncoder.comparePassword(credential.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 일치하지 않습니다.');
    }

    // 토큰 생성
    return this.tokenService.createToken(user);
  }
}
