import { TestHelper } from '@test/integration/test-helper';
import request from 'supertest';

import { HttpStatus, INestApplication } from '@nestjs/common';

describe('AuthController (Integration)', () => {
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

  // 테스트용 사용자 생성 헬퍼 함수
  const createTestUser = async (email: string, password: string, nickname: string) => {
    await request(app.getHttpServer()).post('/users').send({ email, password, nickname }).expect(HttpStatus.CREATED);
  };

  describe('POST /auth/signin', () => {
    it('유효한 이메일과 비밀번호로 로그인 시 200 상태코드와 토큰을 반환한다', async () => {
      // given
      const userEmail = 'test@example.com';
      const userPassword = 'SecurePassword123!';
      await createTestUser(userEmail, userPassword, '테스트유저');

      const signInRequest = {
        email: userEmail,
        password: userPassword,
      };

      // when
      const response = await request(app.getHttpServer())
        .post('/auth/signin')
        .send(signInRequest)
        .expect(HttpStatus.OK);

      // then
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(typeof response.body.data.accessToken).toBe('string');
      expect(typeof response.body.data.refreshToken).toBe('string');
    });

    it('존재하지 않는 이메일로 로그인 시 401 상태코드를 반환한다', async () => {
      // given
      const signInRequest = {
        email: 'nonexistent@example.com',
        password: 'SecurePassword123!',
      };

      // when & then
      await request(app.getHttpServer()).post('/auth/signin').send(signInRequest).expect(HttpStatus.UNAUTHORIZED);
    });

    it('잘못된 비밀번호로 로그인 시 401 상태코드를 반환한다', async () => {
      // given
      const userEmail = 'test@example.com';
      const userPassword = 'SecurePassword123!';
      await createTestUser(userEmail, userPassword, '테스트유저');

      const signInRequest = {
        email: userEmail,
        password: 'WrongPassword123!',
      };

      // when & then
      await request(app.getHttpServer()).post('/auth/signin').send(signInRequest).expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('GET /auth/me', () => {
    it('유효한 액세스 토큰으로 요청 시 200 상태코드와 사용자 정보를 반환한다', async () => {
      // given
      const userEmail = 'test@example.com';
      const userPassword = 'SecurePassword123!';
      await createTestUser(userEmail, userPassword, '테스트유저');

      const signInResponse = await request(app.getHttpServer())
        .post('/auth/signin')
        .send({ email: userEmail, password: userPassword })
        .expect(HttpStatus.OK);

      const accessToken = signInResponse.body.data.accessToken;

      // when
      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(HttpStatus.OK);

      // then
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('userId');
      expect(response.body.data).toHaveProperty('role');
      expect(typeof response.body.data.userId).toBe('string');
      expect(response.body.data.role).toBe('USER');
    });

    it('액세스 토큰 없이 요청 시 401 상태코드를 반환한다', async () => {
      // when & then
      await request(app.getHttpServer()).get('/auth/me').expect(HttpStatus.UNAUTHORIZED);
    });

    it('잘못된 액세스 토큰으로 요청 시 401 상태코드를 반환한다', async () => {
      // given
      const invalidToken = 'invalid.token.here';

      // when & then
      await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${invalidToken}`)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('Bearer 형식이 아닌 토큰으로 요청 시 401 상태코드를 반환한다', async () => {
      // given
      const userEmail = 'test@example.com';
      const userPassword = 'SecurePassword123!';
      await createTestUser(userEmail, userPassword, '테스트유저');

      const signInResponse = await request(app.getHttpServer())
        .post('/auth/signin')
        .send({ email: userEmail, password: userPassword })
        .expect(HttpStatus.OK);

      const accessToken = signInResponse.body.data.accessToken;

      // when & then
      await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', accessToken) // Bearer 없이 토큰만 전송
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });
});
