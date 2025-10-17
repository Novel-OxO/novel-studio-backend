import { forwardRef, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { AccessTokenGuard } from '@/api/controller/auth/access-token.guard';
import { AdminGuard } from '@/api/controller/auth/admin.guard';
import { AuthController } from '@/api/controller/auth/auth.controller';

import { AuthService } from '@/domain/auth/auth.service';
import { PasswordEncoder } from '@/domain/auth/password-encoder';
import { TokenService } from '@/domain/auth/token.service';

import { UserModule } from './user.module';

@Module({
  imports: [JwtModule.register({}), forwardRef(() => UserModule)],
  controllers: [AuthController],
  providers: [PasswordEncoder, TokenService, AuthService, AccessTokenGuard, AdminGuard],
  exports: [PasswordEncoder, TokenService, AuthService, AccessTokenGuard, AdminGuard],
})
export class AuthModule {}
