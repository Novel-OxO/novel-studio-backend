import { exec } from 'child_process';
import { resolve } from 'path';
import { promisify } from 'util';

import { config } from 'dotenv';

const execAsync = promisify(exec);

/**
 * 전역 테스트 셋업
 * - 테스트 실행 전 Prisma 마이그레이션 실행
 */
export default async function globalSetup() {
  console.log('테스트 환경 초기화 중...\n');

  try {
    // .env.test 파일 로드
    const envPath = resolve(__dirname, '../../.env.test');
    config({ path: envPath });
    console.log('테스트 환경 변수 로드 완료');

    // Prisma 마이그레이션 실행
    console.log('Prisma 마이그레이션 실행 중...');
    await execAsync('npx prisma migrate deploy', {
      env: { ...process.env },
    });

    console.log('테스트 환경 초기화 완료!\n');
  } catch (error) {
    console.error('테스트 환경 초기화 실패:', error);
    throw error;
  }
}
