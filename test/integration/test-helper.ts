import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { PrismaClient } from '@prisma/client';

import { AppModule } from '@/modules/app.module';

/**
 * 통합 테스트를 위한 헬퍼 클래스
 */
export class TestHelper {
  private static app: INestApplication;
  private static prisma: PrismaClient;
  private static moduleRef: TestingModule;

  /**
   * 테스트 애플리케이션 초기화
   */
  static async initializeApp(): Promise<INestApplication> {
    if (this.app) {
      return this.app;
    }

    this.moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    this.app = this.moduleRef.createNestApplication();

    // Validation Pipe 설정 (실제 애플리케이션과 동일하게)
    this.app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await this.app.init();

    this.prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });

    await this.prisma.$connect();

    return this.app;
  }

  /**
   * 테스트 애플리케이션 반환
   */
  static getApp(): INestApplication {
    if (!this.app) {
      throw new Error('App not initialized. Call initializeApp() first.');
    }
    return this.app;
  }

  /**
   * Prisma 클라이언트 반환
   */
  static getPrisma(): PrismaClient {
    if (!this.prisma) {
      throw new Error('Prisma not initialized. Call initializeApp() first.');
    }
    return this.prisma;
  }

  /**
   * 데이터베이스 초기화 (모든 데이터 삭제)
   */
  static async cleanDatabase(): Promise<void> {
    if (!this.prisma) {
      throw new Error('Prisma not initialized. Call initializeApp() first.');
    }

    // 모든 테이블의 데이터 삭제 (외래 키 제약 조건 고려하여 순서 중요)
    await this.prisma.section.deleteMany({});
    await this.prisma.course.deleteMany({});
    await this.prisma.user.deleteMany({});
  }

  /**
   * 테스트 애플리케이션 종료
   */
  static async closeApp(): Promise<void> {
    if (this.prisma) {
      await this.prisma.$disconnect();
    }
    if (this.app) {
      await this.app.close();
    }
  }
}
