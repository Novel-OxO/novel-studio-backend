import { Module } from '@nestjs/common';

import { PasswordEncoder } from '@/domain/auth/password-encoder';

@Module({
  providers: [PasswordEncoder],
  exports: [PasswordEncoder],
})
export class AuthModule {}
