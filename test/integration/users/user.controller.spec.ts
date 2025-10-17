import { TestHelper } from '@test/integration/test-helper';
import request from 'supertest';

import { HttpStatus, INestApplication } from '@nestjs/common';

describe('UserController (Integration)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await TestHelper.initializeApp();
  });

  afterAll(async () => {
    await TestHelper.closeApp();
  });

  beforeEach(async () => {
    // 각 테스트 전에 데이터베이스 초기화
    await TestHelper.cleanDatabase();
  });

  describe('POST /users', () => {
    it('유효한 데이터로 회원가입 시 201 상태코드와 사용자 정보를 반환한다', async () => {
      // given
      const createUserRequest = {
        email: 'test@example.com',
        password: 'SecurePassword123!',
        nickname: '테스트유저',
      };

      // when
      const response = await request(app.getHttpServer())
        .post('/users')
        .send(createUserRequest)
        .expect(HttpStatus.CREATED);

      // then
      expect(response.body).toMatchObject({
        email: createUserRequest.email,
        nickname: createUserRequest.nickname,
        profileImageUrl: null,
        role: 'USER',
      });
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('createdAt');
    });

    it('중복된 이메일로 회원가입 시 409 상태코드를 반환한다', async () => {
      // given
      const createUserRequest = {
        email: 'duplicate@example.com',
        password: 'SecurePassword123!',
        nickname: '첫번째유저',
      };

      // 첫 번째 사용자 생성
      await request(app.getHttpServer()).post('/users').send(createUserRequest).expect(HttpStatus.CREATED);

      // when & then
      const duplicateRequest = {
        ...createUserRequest,
        nickname: '두번째유저', // 닉네임만 다르게
      };

      await request(app.getHttpServer()).post('/users').send(duplicateRequest).expect(HttpStatus.CONFLICT);
    });

    it('비밀번호는 암호화되어 저장된다', async () => {
      // given
      const createUserRequest = {
        email: 'test@example.com',
        password: 'SecurePassword123!',
        nickname: '테스트유저',
      };

      // when
      await request(app.getHttpServer()).post('/users').send(createUserRequest).expect(HttpStatus.CREATED);

      // then - 데이터베이스에서 사용자 확인
      const prisma = TestHelper.getPrisma();
      const user = await prisma.user.findUnique({
        where: { email: createUserRequest.email },
      });

      expect(user).not.toBeNull();
      expect(user!.hashedPassword).not.toBe(createUserRequest.password);
      expect(user!.hashedPassword.length).toBeGreaterThan(0);
    });
  });
});
