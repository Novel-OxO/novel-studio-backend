import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';

import { LoggerMiddleware } from '@/api/support';

import { PrismaModule } from './prisma.module';
import { UserModule } from './user.module';

const externalModules = [PrismaModule, UserModule];

@Module({
  imports: [...externalModules],
  controllers: [],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
