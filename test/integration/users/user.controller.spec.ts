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
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toMatchObject({
        email: createUserRequest.email,
        nickname: createUserRequest.nickname,
        profileImageUrl: null,
        role: 'USER',
      });
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('createdAt');
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

  describe('PATCH /users', () => {
    const createUserAndLogin = async (email: string, password: string, nickname: string) => {
      await request(app.getHttpServer()).post('/users').send({ email, password, nickname }).expect(HttpStatus.CREATED);

      const loginResponse = await request(app.getHttpServer())
        .post('/auth/signin')
        .send({ email, password })
        .expect(HttpStatus.OK);

      return loginResponse.body.data.accessToken;
    };

    it('유효한 토큰으로 닉네임 수정 시 200 상태코드와 수정된 사용자 정보를 반환한다', async () => {
      // given
      const accessToken = await createUserAndLogin('test@example.com', 'SecurePassword123!', '원래닉네임');

      const updateRequest = {
        nickname: '새로운닉네임',
      };

      // when
      const response = await request(app.getHttpServer())
        .patch('/users')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateRequest)
        .expect(HttpStatus.OK);

      // then
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toMatchObject({
        email: 'test@example.com',
        nickname: '새로운닉네임',
      });
    });

    it('유효한 토큰으로 프로필 이미지 URL 수정 시 200 상태코드와 수정된 사용자 정보를 반환한다', async () => {
      // given
      const accessToken = await createUserAndLogin('test@example.com', 'SecurePassword123!', '테스트유저');

      const updateRequest = {
        profileImageUrl: 'https://example.com/new-profile.jpg',
      };

      // when
      const response = await request(app.getHttpServer())
        .patch('/users')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateRequest)
        .expect(HttpStatus.OK);

      // then
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.profileImageUrl).toBe('https://example.com/new-profile.jpg');
    });

    it('닉네임과 프로필 이미지를 동시에 수정할 수 있다', async () => {
      // given
      const accessToken = await createUserAndLogin('test@example.com', 'SecurePassword123!', '원래닉네임');

      const updateRequest = {
        nickname: '새닉네임',
        profileImageUrl: 'https://example.com/profile.jpg',
      };

      // when
      const response = await request(app.getHttpServer())
        .patch('/users')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateRequest)
        .expect(HttpStatus.OK);

      // then
      expect(response.body.data).toMatchObject({
        email: 'test@example.com',
        nickname: '새닉네임',
        profileImageUrl: 'https://example.com/profile.jpg',
      });
    });

    it('토큰 없이 요청 시 401 상태코드를 반환한다', async () => {
      // given
      const updateRequest = {
        nickname: '새닉네임',
      };

      // when & then
      await request(app.getHttpServer()).patch('/users').send(updateRequest).expect(HttpStatus.UNAUTHORIZED);
    });

    it('프로필 이미지 URL을 null로 설정할 수 있다', async () => {
      // given
      const accessToken = await createUserAndLogin('test@example.com', 'SecurePassword123!', '테스트유저');

      // 먼저 프로필 이미지 설정
      await request(app.getHttpServer())
        .patch('/users')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ profileImageUrl: 'https://example.com/profile.jpg' })
        .expect(HttpStatus.OK);

      // when - null로 변경
      const response = await request(app.getHttpServer())
        .patch('/users')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ profileImageUrl: null })
        .expect(HttpStatus.OK);

      // then
      expect(response.body.data.profileImageUrl).toBeNull();
    });
  });
});
