import { INestApplication, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { GlobalExceptionFilter } from './api/support';
import { AppModule } from './modules/app.module';

function setupGlobalPipes(app: INestApplication) {
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
}

function setupGlobalFilters(app: INestApplication) {
  app.useGlobalFilters(new GlobalExceptionFilter());
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  setupGlobalPipes(app);
  setupGlobalFilters(app);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
