import { TestHelper } from '@test/integration/test-helper';
import request from 'supertest';

import { HttpStatus, INestApplication } from '@nestjs/common';

import { CourseStatus, OrderStatus } from '@prisma/client';

describe('OrderController (Integration)', () => {
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
  const createCourse = async (adminAccessToken: string, slug: string, title: string, price: number = 50000) => {
    const response = await request(app.getHttpServer())
      .post('/courses')
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send({
        slug,
        title,
        description: `${title} 설명`,
        price,
        status: CourseStatus.OPEN,
      })
      .expect(HttpStatus.CREATED);

    return response.body.data;
  };

  // 장바구니에 코스 추가 헬퍼 함수
  const addToCart = async (userAccessToken: string, courseId: string) => {
    await request(app.getHttpServer())
      .post('/cart')
      .set('Authorization', `Bearer ${userAccessToken}`)
      .send({ courseId })
      .expect(HttpStatus.CREATED);
  };

  describe('POST /orders', () => {
    it('장바구니에 있는 코스로 주문을 생성하면 201 상태코드와 주문 정보를 반환한다', async () => {
      // given
      const { accessToken: adminToken } = await createAdminUserAndLogin();
      const { userId, accessToken: userToken } = await createUserAndLogin();
      const course1 = await createCourse(adminToken, 'course-1', 'NestJS 기초', 50000);
      const course2 = await createCourse(adminToken, 'course-2', 'TypeScript 고급', 70000);

      await addToCart(userToken, course1.id);
      await addToCart(userToken, course2.id);

      // when
      const response = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(HttpStatus.CREATED);

      // then
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toMatchObject({
        userId,
        totalPrice: 120000,
        status: OrderStatus.PENDING,
      });
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('orderItems');
      expect(response.body.data.orderItems).toHaveLength(2);
      // orderItems는 생성 순서대로 정렬됨
      const orderItemsCourseIds = response.body.data.orderItems.map((item: any) => item.courseId);
      expect(orderItemsCourseIds).toContain(course1.id);
      expect(orderItemsCourseIds).toContain(course2.id);
      expect(response.body.data).toHaveProperty('createdAt');
      expect(response.body.data).toHaveProperty('updatedAt');

      // 장바구니가 비워졌는지 확인
      const cartResponse = await request(app.getHttpServer())
        .get('/cart')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(HttpStatus.OK);

      expect(cartResponse.body.data).toHaveLength(0);
    });

    it('빈 장바구니로 주문 생성 시 400 상태코드를 반환한다', async () => {
      // given
      const { accessToken: userToken } = await createUserAndLogin();

      // when & then
      const response = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error.message).toContain('장바구니가 비어있습니다');
    });

    it('인증되지 않은 사용자가 주문 생성 시 401 상태코드를 반환한다', async () => {
      // when & then
      await request(app.getHttpServer()).post('/orders').expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('GET /orders', () => {
    it('사용자의 주문 목록을 조회하면 200 상태코드와 주문 목록을 반환한다', async () => {
      // given
      const { accessToken: adminToken } = await createAdminUserAndLogin();
      const { userId, accessToken: userToken } = await createUserAndLogin();
      const course1 = await createCourse(adminToken, 'course-1', '코스 1', 30000);
      const course2 = await createCourse(adminToken, 'course-2', '코스 2', 40000);

      // 첫 번째 주문
      await addToCart(userToken, course1.id);
      await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(HttpStatus.CREATED);

      // 두 번째 주문
      await addToCart(userToken, course2.id);
      await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(HttpStatus.CREATED);

      // when
      const response = await request(app.getHttpServer())
        .get('/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(HttpStatus.OK);

      // then
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('items');
      expect(response.body.data.items).toHaveLength(2);
      expect(response.body.data.items[0]).toMatchObject({
        userId,
        totalPrice: 40000,
        status: OrderStatus.PENDING,
      });
      expect(response.body.data.items[1]).toMatchObject({
        userId,
        totalPrice: 30000,
        status: OrderStatus.PENDING,
      });
      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.pagination).toMatchObject({
        totalCount: 2,
        page: 1,
        pageSize: 10,
        totalPages: 1,
      });
    });

    it('페이지네이션을 적용하여 주문 목록을 조회할 수 있다', async () => {
      // given
      const { accessToken: adminToken } = await createAdminUserAndLogin();
      const { accessToken: userToken } = await createUserAndLogin();
      const course = await createCourse(adminToken, 'course', '코스', 10000);

      // 3개의 주문 생성
      for (let i = 0; i < 3; i++) {
        await addToCart(userToken, course.id);
        await request(app.getHttpServer())
          .post('/orders')
          .set('Authorization', `Bearer ${userToken}`)
          .expect(HttpStatus.CREATED);
      }

      // when - 페이지 크기 2로 첫 페이지 조회
      const response = await request(app.getHttpServer())
        .get('/orders?page=1&pageSize=2')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(HttpStatus.OK);

      // then
      expect(response.body.data.items).toHaveLength(2);
      expect(response.body.data.pagination).toMatchObject({
        totalCount: 3,
        page: 1,
        pageSize: 2,
        totalPages: 2,
      });
    });

    it('주문 상태로 필터링하여 조회할 수 있다', async () => {
      // given
      const { accessToken: adminToken } = await createAdminUserAndLogin();
      const { accessToken: userToken } = await createUserAndLogin();
      const course = await createCourse(adminToken, 'course', '코스', 10000);
      const prisma = TestHelper.getPrisma();

      // 주문 생성
      await addToCart(userToken, course.id);
      const orderResponse = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(HttpStatus.CREATED);

      const orderId = orderResponse.body.data.id;

      // 주문 상태를 PAID로 변경
      await prisma.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.PAID },
      });

      // 다른 PENDING 주문 생성
      await addToCart(userToken, course.id);
      await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(HttpStatus.CREATED);

      // when - PENDING 상태만 조회
      const response = await request(app.getHttpServer())
        .get(`/orders?status=${OrderStatus.PENDING}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(HttpStatus.OK);

      // then
      expect(response.body.data.items).toHaveLength(1);
      expect(response.body.data.items[0].status).toBe(OrderStatus.PENDING);
    });

    it('주문이 없는 경우 빈 배열을 반환한다', async () => {
      // given
      const { accessToken: userToken } = await createUserAndLogin();

      // when
      const response = await request(app.getHttpServer())
        .get('/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(HttpStatus.OK);

      // then
      expect(response.body.data.items).toHaveLength(0);
      expect(response.body.data.pagination).toMatchObject({
        totalCount: 0,
        page: 1,
        pageSize: 10,
        totalPages: 0,
      });
    });

    it('인증되지 않은 사용자가 주문 목록 조회 시 401 상태코드를 반환한다', async () => {
      // when & then
      await request(app.getHttpServer()).get('/orders').expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('GET /orders/:id', () => {
    it('주문 ID로 주문 상세를 조회하면 200 상태코드와 주문 정보를 반환한다', async () => {
      // given
      const { accessToken: adminToken } = await createAdminUserAndLogin();
      const { userId, accessToken: userToken } = await createUserAndLogin();
      const course = await createCourse(adminToken, 'course', 'NestJS 완벽 가이드', 100000);

      await addToCart(userToken, course.id);
      const orderResponse = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(HttpStatus.CREATED);

      const orderId = orderResponse.body.data.id;

      // when
      const response = await request(app.getHttpServer())
        .get(`/orders/${orderId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(HttpStatus.OK);

      // then
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toMatchObject({
        id: orderId,
        userId,
        totalPrice: 100000,
        status: OrderStatus.PENDING,
      });
      expect(response.body.data.orderItems).toHaveLength(1);
      expect(response.body.data.orderItems[0]).toMatchObject({
        courseId: course.id,
        courseTitle: 'NestJS 완벽 가이드',
        courseSlug: 'course',
        price: 100000,
      });
    });

    it('존재하지 않는 주문 ID로 조회 시 404 상태코드를 반환한다', async () => {
      // given
      const { accessToken: userToken } = await createUserAndLogin();
      const nonExistentOrderId = 'non-existent-order-id';

      // when & then
      const response = await request(app.getHttpServer())
        .get(`/orders/${nonExistentOrderId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(HttpStatus.NOT_FOUND);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error.message).toContain('주문을 찾을 수 없습니다');
    });

    it('다른 사용자의 주문을 조회 시 403 상태코드를 반환한다', async () => {
      // given
      const { accessToken: adminToken } = await createAdminUserAndLogin();

      // 첫 번째 사용자가 주문 생성
      await request(app.getHttpServer())
        .post('/users')
        .send({
          email: 'user1@example.com',
          password: 'UserPassword123!',
          nickname: '유저1',
        })
        .expect(HttpStatus.CREATED);

      const loginResponse1 = await request(app.getHttpServer())
        .post('/auth/signin')
        .send({
          email: 'user1@example.com',
          password: 'UserPassword123!',
        })
        .expect(HttpStatus.OK);

      const user1Token = loginResponse1.body.data.accessToken;
      const course = await createCourse(adminToken, 'course', '코스', 50000);

      await addToCart(user1Token, course.id);
      const orderResponse = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(HttpStatus.CREATED);

      const orderId = orderResponse.body.data.id;

      // 두 번째 사용자 생성
      await request(app.getHttpServer())
        .post('/users')
        .send({
          email: 'user2@example.com',
          password: 'UserPassword123!',
          nickname: '유저2',
        })
        .expect(HttpStatus.CREATED);

      const loginResponse2 = await request(app.getHttpServer())
        .post('/auth/signin')
        .send({
          email: 'user2@example.com',
          password: 'UserPassword123!',
        })
        .expect(HttpStatus.OK);

      const user2Token = loginResponse2.body.data.accessToken;

      // when & then - 두 번째 사용자가 첫 번째 사용자의 주문 조회 시도
      const response = await request(app.getHttpServer())
        .get(`/orders/${orderId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(HttpStatus.FORBIDDEN);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error.message).toContain('다른 사용자의 주문은 조회할 수 없습니다');
    });

    it('인증되지 않은 사용자가 주문 상세 조회 시 401 상태코드를 반환한다', async () => {
      // when & then
      await request(app.getHttpServer()).get('/orders/some-order-id').expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('DELETE /orders/:id', () => {
    it('PENDING 상태의 주문을 취소하면 204 상태코드를 반환한다', async () => {
      // given
      const { accessToken: adminToken } = await createAdminUserAndLogin();
      const { accessToken: userToken } = await createUserAndLogin();
      const course = await createCourse(adminToken, 'course', '코스', 50000);

      await addToCart(userToken, course.id);
      const orderResponse = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(HttpStatus.CREATED);

      const orderId = orderResponse.body.data.id;

      // when
      await request(app.getHttpServer())
        .delete(`/orders/${orderId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(HttpStatus.NO_CONTENT);

      // then - 주문 상태가 CANCELLED로 변경되었는지 확인
      const response = await request(app.getHttpServer())
        .get(`/orders/${orderId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(HttpStatus.OK);

      expect(response.body.data.status).toBe(OrderStatus.CANCELLED);
    });

    it('존재하지 않는 주문을 취소 시 404 상태코드를 반환한다', async () => {
      // given
      const { accessToken: userToken } = await createUserAndLogin();
      const nonExistentOrderId = 'non-existent-order-id';

      // when & then
      const response = await request(app.getHttpServer())
        .delete(`/orders/${nonExistentOrderId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(HttpStatus.NOT_FOUND);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error.message).toContain('주문을 찾을 수 없습니다');
    });

    it('PENDING 상태가 아닌 주문을 취소 시 400 상태코드를 반환한다', async () => {
      // given
      const { accessToken: adminToken } = await createAdminUserAndLogin();
      const { accessToken: userToken } = await createUserAndLogin();
      const course = await createCourse(adminToken, 'course', '코스', 50000);
      const prisma = TestHelper.getPrisma();

      await addToCart(userToken, course.id);
      const orderResponse = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(HttpStatus.CREATED);

      const orderId = orderResponse.body.data.id;

      // 주문 상태를 PAID로 변경
      await prisma.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.PAID },
      });

      // when & then
      const response = await request(app.getHttpServer())
        .delete(`/orders/${orderId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error.message).toContain('결제 대기 중인 주문만 취소할 수 있습니다');
    });

    it('다른 사용자의 주문을 취소 시 403 상태코드를 반환한다', async () => {
      // given
      const { accessToken: adminToken } = await createAdminUserAndLogin();

      // 첫 번째 사용자가 주문 생성
      await request(app.getHttpServer())
        .post('/users')
        .send({
          email: 'user1@example.com',
          password: 'UserPassword123!',
          nickname: '유저1',
        })
        .expect(HttpStatus.CREATED);

      const loginResponse1 = await request(app.getHttpServer())
        .post('/auth/signin')
        .send({
          email: 'user1@example.com',
          password: 'UserPassword123!',
        })
        .expect(HttpStatus.OK);

      const user1Token = loginResponse1.body.data.accessToken;
      const course = await createCourse(adminToken, 'course', '코스', 50000);

      await addToCart(user1Token, course.id);
      const orderResponse = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(HttpStatus.CREATED);

      const orderId = orderResponse.body.data.id;

      // 두 번째 사용자 생성
      await request(app.getHttpServer())
        .post('/users')
        .send({
          email: 'user2@example.com',
          password: 'UserPassword123!',
          nickname: '유저2',
        })
        .expect(HttpStatus.CREATED);

      const loginResponse2 = await request(app.getHttpServer())
        .post('/auth/signin')
        .send({
          email: 'user2@example.com',
          password: 'UserPassword123!',
        })
        .expect(HttpStatus.OK);

      const user2Token = loginResponse2.body.data.accessToken;

      // when & then - 두 번째 사용자가 첫 번째 사용자의 주문 취소 시도
      const response = await request(app.getHttpServer())
        .delete(`/orders/${orderId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(HttpStatus.FORBIDDEN);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error.message).toContain('다른 사용자의 주문은 취소할 수 없습니다');
    });

    it('인증되지 않은 사용자가 주문 취소 시 401 상태코드를 반환한다', async () => {
      // when & then
      await request(app.getHttpServer()).delete('/orders/some-order-id').expect(HttpStatus.UNAUTHORIZED);
    });
  });
});
