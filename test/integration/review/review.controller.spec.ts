import { TestHelper } from '@test/integration/test-helper';
import request from 'supertest';

import { HttpStatus, INestApplication } from '@nestjs/common';

import { CourseLevel, CourseStatus } from '@prisma/client';

describe('ReviewController (Integration)', () => {
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

  // 관리자 사용자 생성 및 로그인
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

  // 일반 사용자 생성 및 로그인
  const createUserAndLogin = async (email: string, nickname: string) => {
    const prisma = TestHelper.getPrisma();
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const bcrypt = require('bcrypt') as { hash: (password: string, salt: number) => Promise<string> };

    const hashedPassword = await bcrypt.hash('UserPassword123!', 10);
    const user = await prisma.user.create({
      data: {
        email,
        hashedPassword,
        nickname,
        role: 'USER',
      },
    });

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/signin')
      .send({
        email,
        password: 'UserPassword123!',
      })
      .expect(HttpStatus.OK);

    return {
      userId: user.id,
      accessToken: loginResponse.body.data.accessToken,
    };
  };

  // 강의 생성
  const createCourse = async (instructorId: string): Promise<string> => {
    const prisma = TestHelper.getPrisma();

    const course = await prisma.course.create({
      data: {
        slug: `test-course-${Date.now()}`,
        title: '테스트 강의',
        description: '테스트용 강의입니다.',
        instructorId,
        level: CourseLevel.BEGINNER,
        status: CourseStatus.OPEN,
        price: 50000,
      },
    });

    return course.id;
  };

  // 수강 등록
  const createEnrollment = async (userId: string, courseId: string): Promise<void> => {
    const prisma = TestHelper.getPrisma();
    await prisma.enrollment.create({
      data: {
        userId,
        courseId,
      },
    });
  };

  describe('POST /reviews/courses/:courseId', () => {
    it('수강생이 리뷰를 작성하면 201 상태코드와 리뷰 정보를 반환한다', async () => {
      // given
      const { adminId } = await createAdminUserAndLogin();
      const { userId, accessToken: userToken } = await createUserAndLogin('student@example.com', '학생');

      const courseId = await createCourse(adminId);
      await createEnrollment(userId, courseId);

      const createReviewRequest = {
        rating: 5,
        title: '정말 좋은 강의입니다',
        content: '이 강의를 듣고 많은 것을 배웠습니다. 강사님의 설명이 명확하고 이해하기 쉬웠습니다.',
      };

      // when & then
      const response = await request(app.getHttpServer())
        .post(`/reviews/courses/${courseId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(createReviewRequest)
        .expect(HttpStatus.CREATED);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        rating: 5,
        title: '정말 좋은 강의입니다',
        userId,
        courseId,
      });
    });

    it('수강하지 않은 사용자가 리뷰 작성 시 403 상태코드를 반환한다', async () => {
      // given
      const { adminId } = await createAdminUserAndLogin();
      const { accessToken: userToken } = await createUserAndLogin('nonStudent@example.com', '비수강생');

      const courseId = await createCourse(adminId);

      const createReviewRequest = {
        rating: 5,
        title: '좋은 강의',
        content: '이 강의를 듣고 많은 것을 배웠습니다. 강사님의 설명이 명확하고 이해하기 쉬웠습니다.',
      };

      // when & then
      await request(app.getHttpServer())
        .post(`/reviews/courses/${courseId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(createReviewRequest)
        .expect(HttpStatus.FORBIDDEN);
    });

    it('중복 리뷰 작성 시 409 상태코드를 반환한다', async () => {
      // given
      const { adminId } = await createAdminUserAndLogin();
      const { userId, accessToken: userToken } = await createUserAndLogin('student@example.com', '학생');

      const courseId = await createCourse(adminId);
      await createEnrollment(userId, courseId);

      const createReviewRequest = {
        rating: 5,
        title: '좋은 강의',
        content: '이 강의를 듣고 많은 것을 배웠습니다. 강사님의 설명이 명확하고 이해하기 쉬웠습니다.',
      };

      // 첫 번째 리뷰 작성
      await request(app.getHttpServer())
        .post(`/reviews/courses/${courseId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(createReviewRequest)
        .expect(HttpStatus.CREATED);

      // when & then - 중복 리뷰 작성 시도
      await request(app.getHttpServer())
        .post(`/reviews/courses/${courseId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          rating: 4,
          title: '다른 리뷰',
          content: '두 번째 리뷰를 작성합니다만 이것은 허용되지 않아야 합니다.',
        })
        .expect(HttpStatus.CONFLICT);
    });

    it('유효하지 않은 평점(0점)으로 리뷰 작성 시 400 상태코드를 반환한다', async () => {
      // given
      const { adminId } = await createAdminUserAndLogin();
      const { userId, accessToken: userToken } = await createUserAndLogin('student@example.com', '학생');

      const courseId = await createCourse(adminId);
      await createEnrollment(userId, courseId);

      const createReviewRequest = {
        rating: 0, // 유효하지 않은 평점
        title: '좋은 강의',
        content: '이 강의를 듣고 많은 것을 배웠습니다. 강사님의 설명이 명확하고 이해하기 쉬웠습니다.',
      };

      // when & then
      await request(app.getHttpServer())
        .post(`/reviews/courses/${courseId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(createReviewRequest)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('유효하지 않은 평점(6점)으로 리뷰 작성 시 400 상태코드를 반환한다', async () => {
      // given
      const { adminId } = await createAdminUserAndLogin();
      const { userId, accessToken: userToken } = await createUserAndLogin('student@example.com', '학생');

      const courseId = await createCourse(adminId);
      await createEnrollment(userId, courseId);

      const createReviewRequest = {
        rating: 6, // 유효하지 않은 평점
        title: '좋은 강의',
        content: '이 강의를 듣고 많은 것을 배웠습니다. 강사님의 설명이 명확하고 이해하기 쉬웠습니다.',
      };

      // when & then
      await request(app.getHttpServer())
        .post(`/reviews/courses/${courseId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(createReviewRequest)
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  describe('GET /reviews/courses/:courseId', () => {
    it('강의별 리뷰 목록을 페이지네이션과 함께 조회한다', async () => {
      // given
      const { adminId } = await createAdminUserAndLogin();
      const { userId: userId1, accessToken: userToken1 } = await createUserAndLogin('student1@example.com', '학생1');
      const { userId: userId2, accessToken: userToken2 } = await createUserAndLogin('student2@example.com', '학생2');

      const courseId = await createCourse(adminId);
      await createEnrollment(userId1, courseId);
      await createEnrollment(userId2, courseId);

      // 리뷰 2개 작성
      await request(app.getHttpServer())
        .post(`/reviews/courses/${courseId}`)
        .set('Authorization', `Bearer ${userToken1}`)
        .send({
          rating: 5,
          title: '첫 번째 리뷰',
          content: '이 강의를 듣고 많은 것을 배웠습니다. 강사님의 설명이 명확하고 이해하기 쉬웠습니다.',
        })
        .expect(HttpStatus.CREATED);
      await request(app.getHttpServer())
        .post(`/reviews/courses/${courseId}`)
        .set('Authorization', `Bearer ${userToken2}`)
        .send({
          rating: 4,
          title: '두 번째 리뷰',
          content: '전반적으로 좋았지만 조금 더 상세한 설명이 있었으면 좋겠습니다. 그래도 추천합니다.',
        })
        .expect(HttpStatus.CREATED);

      // when & then
      const response = await request(app.getHttpServer())
        .get(`/reviews/courses/${courseId}`)
        .query({ page: 1, pageSize: 10 })
        .expect(HttpStatus.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toHaveLength(2);
      expect(response.body.data.pagination.totalCount).toBe(2);
    });
  });

  describe('GET /reviews/courses/:courseId/statistics', () => {
    it('강의 리뷰 통계를 조회한다', async () => {
      // given
      const { adminId } = await createAdminUserAndLogin();
      const { userId: userId1, accessToken: userToken1 } = await createUserAndLogin('student1@example.com', '학생1');
      const { userId: userId2, accessToken: userToken2 } = await createUserAndLogin('student2@example.com', '학생2');

      const courseId = await createCourse(adminId);
      await createEnrollment(userId1, courseId);
      await createEnrollment(userId2, courseId);

      // 리뷰 2개 작성 (5점, 3점)
      await request(app.getHttpServer())
        .post(`/reviews/courses/${courseId}`)
        .set('Authorization', `Bearer ${userToken1}`)
        .send({
          rating: 5,
          title: '좋은 강의',
          content: '이 강의를 듣고 많은 것을 배웠습니다. 강사님의 설명이 명확하고 이해하기 쉬웠습니다.',
        })
        .expect(HttpStatus.CREATED);
      await request(app.getHttpServer())
        .post(`/reviews/courses/${courseId}`)
        .set('Authorization', `Bearer ${userToken2}`)
        .send({
          rating: 3,
          title: '보통입니다',
          content: '전반적으로 보통이었습니다. 일부 내용은 좋았지만 개선이 필요한 부분도 있습니다.',
        })
        .expect(HttpStatus.CREATED);

      // when & then
      const response = await request(app.getHttpServer())
        .get(`/reviews/courses/${courseId}/statistics`)
        .expect(HttpStatus.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.data.totalCount).toBe(2);
      expect(response.body.data.averageRating).toBe(4); // (5 + 3) / 2 = 4
      expect(response.body.data.ratingDistribution).toEqual(
        expect.arrayContaining([
          { rating: 5, count: 1 },
          { rating: 4, count: 0 },
          { rating: 3, count: 1 },
          { rating: 2, count: 0 },
          { rating: 1, count: 0 },
        ]),
      );
    });
  });

  describe('GET /reviews/:reviewId', () => {
    it('리뷰 상세 정보를 조회한다', async () => {
      // given
      const { adminId } = await createAdminUserAndLogin();
      const { userId, accessToken: userToken } = await createUserAndLogin('student@example.com', '학생');

      const courseId = await createCourse(adminId);
      await createEnrollment(userId, courseId);

      const createResponse = await request(app.getHttpServer())
        .post(`/reviews/courses/${courseId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          rating: 5,
          title: '좋은 강의',
          content: '이 강의를 듣고 많은 것을 배웠습니다. 강사님의 설명이 명확하고 이해하기 쉬웠습니다.',
        })
        .expect(HttpStatus.CREATED);

      const reviewId = createResponse.body.data.id;

      // when & then
      const response = await request(app.getHttpServer()).get(`/reviews/${reviewId}`).expect(HttpStatus.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        id: reviewId,
        rating: 5,
        title: '좋은 강의',
        userId,
        courseId,
      });
    });

    it('존재하지 않는 리뷰 조회 시 404 상태코드를 반환한다', async () => {
      // given
      const invalidReviewId = 'non-existent-id';

      // when & then
      await request(app.getHttpServer()).get(`/reviews/${invalidReviewId}`).expect(HttpStatus.NOT_FOUND);
    });
  });

  describe('PATCH /reviews/:reviewId', () => {
    it('작성자가 본인의 리뷰를 수정하면 200 상태코드와 수정된 리뷰를 반환한다', async () => {
      // given
      const { adminId } = await createAdminUserAndLogin();
      const { userId, accessToken: userToken } = await createUserAndLogin('student@example.com', '학생');

      const courseId = await createCourse(adminId);
      await createEnrollment(userId, courseId);

      const createResponse = await request(app.getHttpServer())
        .post(`/reviews/courses/${courseId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          rating: 5,
          title: '좋은 강의',
          content: '이 강의를 듣고 많은 것을 배웠습니다. 강사님의 설명이 명확하고 이해하기 쉬웠습니다.',
        })
        .expect(HttpStatus.CREATED);

      const reviewId = createResponse.body.data.id;

      const updateRequest = {
        rating: 4,
        title: '수정된 제목',
        content: '수정된 내용입니다. 다시 생각해보니 4점이 적절한 것 같습니다.',
      };

      // when & then
      const response = await request(app.getHttpServer())
        .patch(`/reviews/${reviewId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateRequest)
        .expect(HttpStatus.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        id: reviewId,
        rating: 4,
        title: '수정된 제목',
      });
    });

    it('다른 사용자가 리뷰 수정 시 403 상태코드를 반환한다', async () => {
      // given
      const { adminId } = await createAdminUserAndLogin();
      const { userId, accessToken: userToken } = await createUserAndLogin('student@example.com', '학생');
      const { accessToken: otherUserToken } = await createUserAndLogin('other@example.com', '다른사용자');

      const courseId = await createCourse(adminId);
      await createEnrollment(userId, courseId);

      const createResponse = await request(app.getHttpServer())
        .post(`/reviews/courses/${courseId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          rating: 5,
          title: '좋은 강의',
          content: '이 강의를 듣고 많은 것을 배웠습니다. 강사님의 설명이 명확하고 이해하기 쉬웠습니다.',
        })
        .expect(HttpStatus.CREATED);

      const reviewId = createResponse.body.data.id;

      // when & then
      await request(app.getHttpServer())
        .patch(`/reviews/${reviewId}`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .send({
          title: '수정 시도',
          content: '다른 사용자가 수정을 시도합니다. 이는 실패해야 합니다.',
        })
        .expect(HttpStatus.FORBIDDEN);
    });
  });

  describe('DELETE /reviews/:reviewId', () => {
    it('작성자가 본인의 리뷰를 삭제하면 204 상태코드를 반환한다', async () => {
      // given
      const { adminId } = await createAdminUserAndLogin();
      const { userId, accessToken: userToken } = await createUserAndLogin('student@example.com', '학생');

      const courseId = await createCourse(adminId);
      await createEnrollment(userId, courseId);

      const createResponse = await request(app.getHttpServer())
        .post(`/reviews/courses/${courseId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          rating: 5,
          title: '좋은 강의',
          content: '이 강의를 듣고 많은 것을 배웠습니다. 강사님의 설명이 명확하고 이해하기 쉬웠습니다.',
        })
        .expect(HttpStatus.CREATED);

      const reviewId = createResponse.body.data.id;

      // when & then
      await request(app.getHttpServer())
        .delete(`/reviews/${reviewId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(HttpStatus.NO_CONTENT);
    });

    it('다른 사용자가 리뷰 삭제 시 403 상태코드를 반환한다', async () => {
      // given
      const { adminId } = await createAdminUserAndLogin();
      const { userId, accessToken: userToken } = await createUserAndLogin('student@example.com', '학생');
      const { accessToken: otherUserToken } = await createUserAndLogin('other@example.com', '다른사용자');

      const courseId = await createCourse(adminId);
      await createEnrollment(userId, courseId);

      const createResponse = await request(app.getHttpServer())
        .post(`/reviews/courses/${courseId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          rating: 5,
          title: '좋은 강의',
          content: '이 강의를 듣고 많은 것을 배웠습니다. 강사님의 설명이 명확하고 이해하기 쉬웠습니다.',
        })
        .expect(HttpStatus.CREATED);

      const reviewId = createResponse.body.data.id;

      // when & then
      await request(app.getHttpServer())
        .delete(`/reviews/${reviewId}`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .expect(HttpStatus.FORBIDDEN);
    });
  });

  describe('POST /reviews/:reviewId/reply', () => {
    it('강사가 리뷰에 답글을 작성하면 201 상태코드와 답글 정보를 반환한다', async () => {
      // given
      const { adminId, accessToken: adminToken } = await createAdminUserAndLogin();
      const { userId, accessToken: userToken } = await createUserAndLogin('student@example.com', '학생');

      const courseId = await createCourse(adminId);
      await createEnrollment(userId, courseId);

      const createResponse = await request(app.getHttpServer())
        .post(`/reviews/courses/${courseId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          rating: 5,
          title: '좋은 강의',
          content: '이 강의를 듣고 많은 것을 배웠습니다. 강사님의 설명이 명확하고 이해하기 쉬웠습니다.',
        })
        .expect(HttpStatus.CREATED);

      const reviewId = createResponse.body.data.id;

      const replyRequest = {
        content: '좋은 리뷰 감사합니다! 앞으로도 더 좋은 강의로 보답하겠습니다.',
      };

      // when & then
      const response = await request(app.getHttpServer())
        .post(`/reviews/${reviewId}/reply`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(replyRequest)
        .expect(HttpStatus.CREATED);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        content: replyRequest.content,
        reviewId,
        userId: adminId,
      });
    });

    it('강사가 아닌 사용자가 답글 작성 시 403 상태코드를 반환한다', async () => {
      // given
      const { adminId } = await createAdminUserAndLogin();
      const { userId, accessToken: userToken } = await createUserAndLogin('student@example.com', '학생');
      const { accessToken: otherUserToken } = await createUserAndLogin('other@example.com', '다른사용자');

      const courseId = await createCourse(adminId);
      await createEnrollment(userId, courseId);

      const createResponse = await request(app.getHttpServer())
        .post(`/reviews/courses/${courseId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          rating: 5,
          title: '좋은 강의',
          content: '이 강의를 듣고 많은 것을 배웠습니다. 강사님의 설명이 명확하고 이해하기 쉬웠습니다.',
        })
        .expect(HttpStatus.CREATED);

      const reviewId = createResponse.body.data.id;

      // when & then
      await request(app.getHttpServer())
        .post(`/reviews/${reviewId}/reply`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .send({
          content: '다른 사용자가 답글을 작성합니다.',
        })
        .expect(HttpStatus.FORBIDDEN);
    });

    it('이미 답글이 있는 리뷰에 답글 작성 시 409 상태코드를 반환한다', async () => {
      // given
      const { adminId, accessToken: adminToken } = await createAdminUserAndLogin();
      const { userId, accessToken: userToken } = await createUserAndLogin('student@example.com', '학생');

      const courseId = await createCourse(adminId);
      await createEnrollment(userId, courseId);

      const createResponse = await request(app.getHttpServer())
        .post(`/reviews/courses/${courseId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          rating: 5,
          title: '좋은 강의',
          content: '이 강의를 듣고 많은 것을 배웠습니다. 강사님의 설명이 명확하고 이해하기 쉬웠습니다.',
        })
        .expect(HttpStatus.CREATED);

      const reviewId = createResponse.body.data.id;

      // 첫 번째 답글 작성
      await request(app.getHttpServer())
        .post(`/reviews/${reviewId}/reply`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          content: '첫 번째 답글입니다.',
        })
        .expect(HttpStatus.CREATED);

      // when & then - 두 번째 답글 작성 시도
      await request(app.getHttpServer())
        .post(`/reviews/${reviewId}/reply`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          content: '두 번째 답글을 작성합니다. 이는 실패해야 합니다.',
        })
        .expect(HttpStatus.CONFLICT);
    });
  });

  describe('GET /reviews/:reviewId/reply', () => {
    it('리뷰에 대한 답글을 조회한다', async () => {
      // given
      const { adminId, accessToken: adminToken } = await createAdminUserAndLogin();
      const { userId, accessToken: userToken } = await createUserAndLogin('student@example.com', '학생');

      const courseId = await createCourse(adminId);
      await createEnrollment(userId, courseId);

      const createResponse = await request(app.getHttpServer())
        .post(`/reviews/courses/${courseId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          rating: 5,
          title: '좋은 강의',
          content: '이 강의를 듣고 많은 것을 배웠습니다. 강사님의 설명이 명확하고 이해하기 쉬웠습니다.',
        })
        .expect(HttpStatus.CREATED);

      const reviewId = createResponse.body.data.id;

      await request(app.getHttpServer())
        .post(`/reviews/${reviewId}/reply`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          content: '좋은 리뷰 감사합니다!',
        })
        .expect(HttpStatus.CREATED);

      // when & then
      const response = await request(app.getHttpServer()).get(`/reviews/${reviewId}/reply`).expect(HttpStatus.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        content: '좋은 리뷰 감사합니다!',
        reviewId,
        userId: adminId,
      });
    });

    it('답글이 없는 리뷰 조회 시 null을 반환한다', async () => {
      // given
      const { adminId } = await createAdminUserAndLogin();
      const { userId, accessToken: userToken } = await createUserAndLogin('student@example.com', '학생');

      const courseId = await createCourse(adminId);
      await createEnrollment(userId, courseId);

      const createResponse = await request(app.getHttpServer())
        .post(`/reviews/courses/${courseId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          rating: 5,
          title: '좋은 강의',
          content: '이 강의를 듣고 많은 것을 배웠습니다. 강사님의 설명이 명확하고 이해하기 쉬웠습니다.',
        })
        .expect(HttpStatus.CREATED);

      const reviewId = createResponse.body.data.id;

      // when & then
      const response = await request(app.getHttpServer()).get(`/reviews/${reviewId}/reply`).expect(HttpStatus.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeNull();
    });
  });

  describe('PATCH /reviews/replies/:replyId', () => {
    it('작성자가 본인의 답글을 수정하면 200 상태코드와 수정된 답글을 반환한다', async () => {
      // given
      const { adminId, accessToken: adminToken } = await createAdminUserAndLogin();
      const { userId, accessToken: userToken } = await createUserAndLogin('student@example.com', '학생');

      const courseId = await createCourse(adminId);
      await createEnrollment(userId, courseId);

      const createResponse = await request(app.getHttpServer())
        .post(`/reviews/courses/${courseId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          rating: 5,
          title: '좋은 강의',
          content: '이 강의를 듣고 많은 것을 배웠습니다. 강사님의 설명이 명확하고 이해하기 쉬웠습니다.',
        })
        .expect(HttpStatus.CREATED);

      const reviewId = createResponse.body.data.id;

      const replyResponse = await request(app.getHttpServer())
        .post(`/reviews/${reviewId}/reply`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          content: '원래 답글입니다. 감사합니다.',
        })
        .expect(HttpStatus.CREATED);

      const replyId = replyResponse.body.data.id;

      const updateRequest = {
        content: '수정된 답글입니다. 더 자세한 설명을 추가합니다.',
      };

      // when & then
      const response = await request(app.getHttpServer())
        .patch(`/reviews/replies/${replyId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateRequest)
        .expect(HttpStatus.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        id: replyId,
        content: updateRequest.content,
      });
    });

    it('다른 사용자가 답글 수정 시 403 상태코드를 반환한다', async () => {
      // given
      const { adminId, accessToken: adminToken } = await createAdminUserAndLogin();
      const { userId, accessToken: userToken } = await createUserAndLogin('student@example.com', '학생');
      const { accessToken: otherUserToken } = await createUserAndLogin('other@example.com', '다른사용자');

      const courseId = await createCourse(adminId);
      await createEnrollment(userId, courseId);

      const createResponse = await request(app.getHttpServer())
        .post(`/reviews/courses/${courseId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          rating: 5,
          title: '좋은 강의',
          content: '이 강의를 듣고 많은 것을 배웠습니다. 강사님의 설명이 명확하고 이해하기 쉬웠습니다.',
        })
        .expect(HttpStatus.CREATED);

      const reviewId = createResponse.body.data.id;

      const replyResponse = await request(app.getHttpServer())
        .post(`/reviews/${reviewId}/reply`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          content: '원래 답글입니다. 감사합니다.',
        })
        .expect(HttpStatus.CREATED);

      const replyId = replyResponse.body.data.id;

      // when & then
      await request(app.getHttpServer())
        .patch(`/reviews/replies/${replyId}`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .send({
          content: '다른 사용자가 수정 시도',
        })
        .expect(HttpStatus.FORBIDDEN);
    });
  });

  describe('DELETE /reviews/replies/:replyId', () => {
    it('작성자가 본인의 답글을 삭제하면 204 상태코드를 반환한다', async () => {
      // given
      const { adminId, accessToken: adminToken } = await createAdminUserAndLogin();
      const { userId, accessToken: userToken } = await createUserAndLogin('student@example.com', '학생');

      const courseId = await createCourse(adminId);
      await createEnrollment(userId, courseId);

      const createResponse = await request(app.getHttpServer())
        .post(`/reviews/courses/${courseId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          rating: 5,
          title: '좋은 강의',
          content: '이 강의를 듣고 많은 것을 배웠습니다. 강사님의 설명이 명확하고 이해하기 쉬웠습니다.',
        })
        .expect(HttpStatus.CREATED);

      const reviewId = createResponse.body.data.id;

      const replyResponse = await request(app.getHttpServer())
        .post(`/reviews/${reviewId}/reply`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          content: '답글입니다. 감사합니다.',
        })
        .expect(HttpStatus.CREATED);

      const replyId = replyResponse.body.data.id;

      // when & then
      await request(app.getHttpServer())
        .delete(`/reviews/replies/${replyId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(HttpStatus.NO_CONTENT);
    });

    it('다른 사용자가 답글 삭제 시 403 상태코드를 반환한다', async () => {
      // given
      const { adminId, accessToken: adminToken } = await createAdminUserAndLogin();
      const { userId, accessToken: userToken } = await createUserAndLogin('student@example.com', '학생');
      const { accessToken: otherUserToken } = await createUserAndLogin('other@example.com', '다른사용자');

      const courseId = await createCourse(adminId);
      await createEnrollment(userId, courseId);

      const createResponse = await request(app.getHttpServer())
        .post(`/reviews/courses/${courseId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          rating: 5,
          title: '좋은 강의',
          content: '이 강의를 듣고 많은 것을 배웠습니다. 강사님의 설명이 명확하고 이해하기 쉬웠습니다.',
        })
        .expect(HttpStatus.CREATED);

      const reviewId = createResponse.body.data.id;

      const replyResponse = await request(app.getHttpServer())
        .post(`/reviews/${reviewId}/reply`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          content: '답글입니다. 감사합니다.',
        })
        .expect(HttpStatus.CREATED);

      const replyId = replyResponse.body.data.id;

      // when & then
      await request(app.getHttpServer())
        .delete(`/reviews/replies/${replyId}`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .expect(HttpStatus.FORBIDDEN);
    });
  });
});
