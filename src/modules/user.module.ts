import { forwardRef, Module } from '@nestjs/common';

import { UserController } from '@/api/controller/users/user.controller';

import { USER_REPOSITORY } from '@/domain/users/user.repository';
import { UserService } from '@/domain/users/user.service';

import { PrismaUserRepository } from '@/infrastructure/database/prisma.user';

import { AuthModule } from './auth.module';
import { PrismaModule } from './prisma.module';

@Module({
  imports: [PrismaModule, forwardRef(() => AuthModule)],
  controllers: [UserController],
  providers: [
    UserService,
    {
      provide: USER_REPOSITORY,
      useClass: PrismaUserRepository,
    },
  ],
  exports: [UserService, USER_REPOSITORY],
})
export class UserModule {}
