import { INestApplication, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { createAppLogger, GlobalExceptionFilter, setupSwagger } from './api/support';
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

function setupCors(app: INestApplication) {
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Authorization'],
  });
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: createAppLogger(),
  });

  setupGlobalPipes(app);
  setupGlobalFilters(app);
  setupCors(app);
  setupSwagger(app);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
