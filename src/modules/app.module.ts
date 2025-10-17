import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { LoggerMiddleware } from '@/api/support';

import { AuthModule } from './auth.module';
import { PrismaModule } from './prisma.module';
import { UserModule } from './user.module';

const getEnvFilePath = (): string => {
  const env = process.env.NODE_ENV || 'development';

  switch (env) {
    case 'production':
      return '.env';
    case 'test':
      return '.env.test';
    case 'development':
    default:
      return '.env.dev';
  }
};

const externalModules = [
  ConfigModule.forRoot({
    isGlobal: true,
    envFilePath: getEnvFilePath(),
  }),
  PrismaModule,
];

const internalModules = [UserModule, AuthModule];

@Module({
  imports: [...externalModules, ...internalModules],
  controllers: [],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
