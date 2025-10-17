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

    it('잘못된 이메일 형식으로 회원가입 시 400 상태코드를 반환한다', async () => {
      // given
      const invalidEmailRequest = {
        email: 'invalid-email',
        password: 'SecurePassword123!',
        nickname: '테스트유저',
      };

      // when & then
      await request(app.getHttpServer()).post('/users').send(invalidEmailRequest).expect(HttpStatus.BAD_REQUEST);
    });

    it('비밀번호가 8자 미만일 때 400 상태코드를 반환한다', async () => {
      // given
      const shortPasswordRequest = {
        email: 'test@example.com',
        password: 'short',
        nickname: '테스트유저',
      };

      // when & then
      await request(app.getHttpServer()).post('/users').send(shortPasswordRequest).expect(HttpStatus.BAD_REQUEST);
    });

    it('닉네임이 2자 미만일 때 400 상태코드를 반환한다', async () => {
      // given
      const shortNicknameRequest = {
        email: 'test@example.com',
        password: 'SecurePassword123!',
        nickname: 'a',
      };

      // when & then
      await request(app.getHttpServer()).post('/users').send(shortNicknameRequest).expect(HttpStatus.BAD_REQUEST);
    });

    it('닉네임이 20자를 초과할 때 400 상태코드를 반환한다', async () => {
      // given
      const longNicknameRequest = {
        email: 'test@example.com',
        password: 'SecurePassword123!',
        nickname: 'a'.repeat(21),
      };

      // when & then
      await request(app.getHttpServer()).post('/users').send(longNicknameRequest).expect(HttpStatus.BAD_REQUEST);
    });

    it('필수 필드가 누락되면 400 상태코드를 반환한다', async () => {
      // given
      const incompleteRequest = {
        email: 'test@example.com',
        // password 누락
        nickname: '테스트유저',
      };

      // when & then
      await request(app.getHttpServer()).post('/users').send(incompleteRequest).expect(HttpStatus.BAD_REQUEST);
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
