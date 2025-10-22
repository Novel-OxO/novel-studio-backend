import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { LoggerMiddleware } from '@/api/support';

import { AuthModule } from './auth.module';
import { CartModule } from './cart.module';
import { CourseModule } from './course.module';
import { LectureModule } from './lecture.module';
import { OrderModule } from './order.module';
import { PaymentModule } from './payment.module';
import { PrismaModule } from './prisma.module';
import { QuestionModule } from './question.module';
import { SectionModule } from './section.module';
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

const internalModules = [
  UserModule,
  AuthModule,
  CourseModule,
  SectionModule,
  LectureModule,
  CartModule,
  OrderModule,
  PaymentModule,
  QuestionModule,
];

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
