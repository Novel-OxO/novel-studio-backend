import * as bcrypt from 'bcrypt';

import { Injectable } from '@nestjs/common';

@Injectable()
export class PasswordEncoder {
  private readonly saltRounds = 10;

  /**
   * 비밀번호를 암호화합니다.
   * @param plainPassword 평문 비밀번호
   * @returns 암호화된 비밀번호
   */
  async hashPassword(plainPassword: string): Promise<string> {
    return bcrypt.hash(plainPassword, this.saltRounds);
  }

  /**
   * 평문 비밀번호와 암호화된 비밀번호를 비교합니다.
   * @param plainPassword 평문 비밀번호
   * @param hashedPassword 암호화된 비밀번호
   * @returns 비밀번호 일치 여부
   */
  async comparePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }
}
