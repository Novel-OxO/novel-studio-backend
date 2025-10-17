import { NestFactory } from '@nestjs/core';

import { GlobalExceptionFilter } from './api/support';
import { AppModule } from './modules/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 글로벌 Exception Filter 등록
  app.useGlobalFilters(new GlobalExceptionFilter());

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
