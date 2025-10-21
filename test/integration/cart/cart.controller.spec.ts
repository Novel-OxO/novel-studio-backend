import { TestHelper } from '@test/integration/test-helper';
import request from 'supertest';

import { HttpStatus, INestApplication } from '@nestjs/common';

import { CourseStatus } from '@prisma/client';

describe('CartController (Integration)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await TestHelper.initializeApp();
  });

  afterAll(async () => {
    await TestHelper.closeApp();
  });

  beforeEach(async () => {
    await TestHelper.cleanDatabase();
  });

  // 관리자 사용자 생성 및 로그인 헬퍼 함수
  const createAdminUserAndLogin = async () => {
    const prisma = TestHelper.getPrisma();
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const bcrypt = require('bcrypt') as { hash: (password: string, salt: number) => Promise<string> };

    const hashedPassword = await bcrypt.hash('AdminPassword123!', 10);
    const admin = await prisma.user.create({
      data: {
        email: 'admin@example.com',
        hashedPassword,
        nickname: '관리자',
        role: 'ADMIN',
      },
    });

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/signin')
      .send({
        email: 'admin@example.com',
        password: 'AdminPassword123!',
      })
      .expect(HttpStatus.OK);

    return {
      adminId: admin.id,
      accessToken: loginResponse.body.data.accessToken,
    };
  };

  // 일반 사용자 생성 및 로그인 헬퍼 함수
  const createUserAndLogin = async () => {
    const response = await request(app.getHttpServer())
      .post('/users')
      .send({
        email: 'user@example.com',
        password: 'UserPassword123!',
        nickname: '일반유저',
      })
      .expect(HttpStatus.CREATED);

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/signin')
      .send({
        email: 'user@example.com',
        password: 'UserPassword123!',
      })
      .expect(HttpStatus.OK);

    return {
      userId: response.body.data.id,
      accessToken: loginResponse.body.data.accessToken,
    };
  };

  // 코스 생성 헬퍼 함수
  const createCourse = async (adminAccessToken: string, slug: string, title: string) => {
    const response = await request(app.getHttpServer())
      .post('/courses')
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send({
        slug,
        title,
        description: `${title} 설명`,
        price: 50000,
        status: CourseStatus.OPEN,
      })
      .expect(HttpStatus.CREATED);

    return response.body.data;
  };

  describe('POST /cart', () => {
    it('사용자가 유효한 코스를 장바구니에 추가 시 201 상태코드와 장바구니 아이템을 반환한다', async () => {
      // given
      const { accessToken: adminToken } = await createAdminUserAndLogin();
      const { userId, accessToken: userToken } = await createUserAndLogin();
      const course = await createCourse(adminToken, 'nestjs-basics', 'NestJS 기초');

      // when
      const response = await request(app.getHttpServer())
        .post('/cart')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          courseId: course.id,
        })
        .expect(HttpStatus.CREATED);

      // then
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toMatchObject({
        userId,
        courseId: course.id,
      });
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('createdAt');
      expect(response.body.data).toHaveProperty('updatedAt');
    });

    it('존재하지 않는 코스를 장바구니에 추가 시 404 상태코드를 반환한다', async () => {
      // given
      const { accessToken } = await createUserAndLogin();
      const nonExistentCourseId = 'non-existent-course-id';

      // when & then
      const response = await request(app.getHttpServer())
        .post('/cart')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          courseId: nonExistentCourseId,
        })
        .expect(HttpStatus.NOT_FOUND);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error.message).toContain('코스를 찾을 수 없습니다');
    });

    it('이미 장바구니에 담긴 코스를 다시 추가 시 409 상태코드를 반환한다', async () => {
      // given
      const { accessToken: adminToken } = await createAdminUserAndLogin();
      const { accessToken: userToken } = await createUserAndLogin();
      const course = await createCourse(adminToken, 'typescript-advanced', 'TypeScript 고급');

      // 장바구니에 추가
      await request(app.getHttpServer())
        .post('/cart')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          courseId: course.id,
        })
        .expect(HttpStatus.CREATED);

      // when & then - 같은 코스를 다시 추가
      const response = await request(app.getHttpServer())
        .post('/cart')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          courseId: course.id,
        })
        .expect(HttpStatus.CONFLICT);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error.message).toContain('이미 장바구니에 담긴 코스입니다');
    });

    it('인증되지 않은 사용자가 장바구니에 추가 시 401 상태코드를 반환한다', async () => {
      // given
      const { accessToken: adminToken } = await createAdminUserAndLogin();
      const course = await createCourse(adminToken, 'react-basics', 'React 기초');

      // when & then
      await request(app.getHttpServer())
        .post('/cart')
        .send({
          courseId: course.id,
        })
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('GET /cart', () => {
    it('사용자가 장바구니 조회 시 200 상태코드와 장바구니 아이템 목록을 반환한다', async () => {
      // given
      const { accessToken: adminToken } = await createAdminUserAndLogin();
      const { accessToken: userToken } = await createUserAndLogin();
      const course1 = await createCourse(adminToken, 'course-1', '코스 1');
      const course2 = await createCourse(adminToken, 'course-2', '코스 2');

      // 장바구니에 추가
      await request(app.getHttpServer())
        .post('/cart')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ courseId: course1.id })
        .expect(HttpStatus.CREATED);

      await request(app.getHttpServer())
        .post('/cart')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ courseId: course2.id })
        .expect(HttpStatus.CREATED);

      // when
      const response = await request(app.getHttpServer())
        .get('/cart')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(HttpStatus.OK);

      // then
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0]).toHaveProperty('course');
      expect(response.body.data[0].course).toMatchObject({
        id: course2.id,
        slug: 'course-2',
        title: '코스 2',
      });
      expect(response.body.data[1].course).toMatchObject({
        id: course1.id,
        slug: 'course-1',
        title: '코스 1',
      });
    });

    it('빈 장바구니 조회 시 200 상태코드와 빈 배열을 반환한다', async () => {
      // given
      const { accessToken } = await createUserAndLogin();

      // when
      const response = await request(app.getHttpServer())
        .get('/cart')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(HttpStatus.OK);

      // then
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveLength(0);
    });

    it('인증되지 않은 사용자가 장바구니 조회 시 401 상태코드를 반환한다', async () => {
      // when & then
      await request(app.getHttpServer()).get('/cart').expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('DELETE /cart/:courseId', () => {
    it('장바구니에 있는 코스를 삭제 시 204 상태코드를 반환한다', async () => {
      // given
      const { accessToken: adminToken } = await createAdminUserAndLogin();
      const { accessToken: userToken } = await createUserAndLogin();
      const course = await createCourse(adminToken, 'delete-course', '삭제할 코스');

      // 장바구니에 추가
      await request(app.getHttpServer())
        .post('/cart')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ courseId: course.id })
        .expect(HttpStatus.CREATED);

      // when
      await request(app.getHttpServer())
        .delete(`/cart/${course.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(HttpStatus.NO_CONTENT);

      // then - 장바구니에서 삭제되었는지 확인
      const response = await request(app.getHttpServer())
        .get('/cart')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(HttpStatus.OK);

      expect(response.body.data).toHaveLength(0);
    });

    it('장바구니에 없는 코스를 삭제 시 404 상태코드를 반환한다', async () => {
      // given
      const { accessToken: adminToken } = await createAdminUserAndLogin();
      const { accessToken: userToken } = await createUserAndLogin();
      const course = await createCourse(adminToken, 'not-in-cart', '장바구니에 없는 코스');

      // when & then
      const response = await request(app.getHttpServer())
        .delete(`/cart/${course.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(HttpStatus.NOT_FOUND);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error.message).toContain('장바구니에 해당 코스가 없습니다');
    });

    it('인증되지 않은 사용자가 장바구니 삭제 시 401 상태코드를 반환한다', async () => {
      // when & then
      await request(app.getHttpServer()).delete('/cart/some-course-id').expect(HttpStatus.UNAUTHORIZED);
    });
  });
});
