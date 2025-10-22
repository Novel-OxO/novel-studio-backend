import { TestHelper } from '@test/integration/test-helper';
import request from 'supertest';

import { HttpStatus, INestApplication } from '@nestjs/common';

import { CourseLevel, CourseStatus } from '@prisma/client';

describe('QuestionController (Integration)', () => {
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
    await request(app.getHttpServer())
      .post('/users')
      .send({
        email,
        password: 'UserPassword123!',
        nickname,
      })
      .expect(HttpStatus.CREATED);

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/signin')
      .send({
        email,
        password: 'UserPassword123!',
      })
      .expect(HttpStatus.OK);

    const prisma = TestHelper.getPrisma();
    const user = await prisma.user.findFirst({ where: { email } });

    return {
      userId: user!.id,
      accessToken: loginResponse.body.data.accessToken,
    };
  };

  // 코스 생성
  const createCourse = async (accessToken: string, instructorId: string) => {
    const prisma = TestHelper.getPrisma();

    const course = await prisma.course.create({
      data: {
        slug: 'test-course',
        title: '테스트 코스',
        description: '테스트용 코스입니다',
        instructorId,
        level: CourseLevel.BEGINNER,
        status: CourseStatus.OPEN,
        price: 10000,
      },
    });

    return course.id;
  };

  // 수강 등록
  const createEnrollment = async (userId: string, courseId: string) => {
    const prisma = TestHelper.getPrisma();

    await prisma.enrollment.create({
      data: {
        userId,
        courseId,
      },
    });
  };

  describe('POST /questions/courses/:courseId', () => {
    it('수강생이 유효한 데이터로 질문 작성 시 201 상태코드와 질문 정보를 반환한다', async () => {
      // given
      const { adminId, accessToken: adminToken } = await createAdminUserAndLogin();
      const { userId, accessToken: userToken } = await createUserAndLogin('student@example.com', '학생');

      const courseId = await createCourse(adminToken, adminId);
      await createEnrollment(userId, courseId);

      const createQuestionRequest = {
        title: '강의 내용 중 궁금한 점이 있습니다',
        content: '섹션 2의 내용이 이해가 잘 안되는데 추가 설명 부탁드립니다.',
      };

      // when
      const response = await request(app.getHttpServer())
        .post(`/questions/courses/${courseId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(createQuestionRequest)
        .expect(HttpStatus.CREATED);

      // then
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toMatchObject({
        title: createQuestionRequest.title,
        content: createQuestionRequest.content,
        userId,
        courseId,
      });
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('createdAt');
    });

    it('수강하지 않은 사용자가 질문 작성 시 403 상태코드를 반환한다', async () => {
      // given
      const { adminId, accessToken: adminToken } = await createAdminUserAndLogin();
      const { accessToken: userToken } = await createUserAndLogin('nonStudent@example.com', '비수강생');

      const courseId = await createCourse(adminToken, adminId);

      const createQuestionRequest = {
        title: '질문 제목',
        content: '이것은 충분히 긴 질문 내용입니다. 최소 20자 이상이어야 합니다.',
      };

      // when & then
      await request(app.getHttpServer())
        .post(`/questions/courses/${courseId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(createQuestionRequest)
        .expect(HttpStatus.FORBIDDEN);
    });

    it('유효하지 않은 제목(너무 짧음)으로 질문 작성 시 400 상태코드를 반환한다', async () => {
      // given
      const { adminId, accessToken: adminToken } = await createAdminUserAndLogin();
      const { userId, accessToken: userToken } = await createUserAndLogin('student@example.com', '학생');

      const courseId = await createCourse(adminToken, adminId);
      await createEnrollment(userId, courseId);

      const createQuestionRequest = {
        title: '짧음', // 5자 미만
        content: '질문 내용이 충분히 긴 텍스트입니다.',
      };

      // when & then
      await request(app.getHttpServer())
        .post(`/questions/courses/${courseId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(createQuestionRequest)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('유효하지 않은 내용(너무 짧음)으로 질문 작성 시 400 상태코드를 반환한다', async () => {
      // given
      const { adminId, accessToken: adminToken } = await createAdminUserAndLogin();
      const { userId, accessToken: userToken } = await createUserAndLogin('student@example.com', '학생');

      const courseId = await createCourse(adminToken, adminId);
      await createEnrollment(userId, courseId);

      const createQuestionRequest = {
        title: '유효한 질문 제목입니다',
        content: '짧음', // 20자 미만
      };

      // when & then
      await request(app.getHttpServer())
        .post(`/questions/courses/${courseId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(createQuestionRequest)
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  describe('GET /questions/courses/:courseId', () => {
    it('강의별 질문 목록을 페이지네이션과 함께 조회한다', async () => {
      // given
      const { adminId, accessToken: adminToken } = await createAdminUserAndLogin();
      const { userId, accessToken: userToken } = await createUserAndLogin('student@example.com', '학생');

      const courseId = await createCourse(adminToken, adminId);
      await createEnrollment(userId, courseId);

      // 여러 개의 질문 생성
      const questions = [];
      for (let i = 1; i <= 3; i++) {
        const response = await request(app.getHttpServer())
          .post(`/questions/courses/${courseId}`)
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            title: `질문 제목 ${i}`,
            content: `질문 내용 ${i}입니다. 충분히 긴 내용으로 작성합니다.`,
          })
          .expect(HttpStatus.CREATED);
        questions.push(response.body.data);
      }

      // when
      const response = await request(app.getHttpServer())
        .get(`/questions/courses/${courseId}`)
        .query({ page: 1, pageSize: 10 })
        .expect(HttpStatus.OK);

      // then
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('items');
      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.items).toHaveLength(3);
      expect(response.body.data.pagination).toMatchObject({
        totalCount: 3,
        page: 1,
        pageSize: 10,
        totalPages: 1,
      });
    });

    it('질문이 없는 강의의 질문 목록 조회 시 빈 배열을 반환한다', async () => {
      // given
      const { adminId, accessToken: adminToken } = await createAdminUserAndLogin();
      const courseId = await createCourse(adminToken, adminId);

      // when
      const response = await request(app.getHttpServer())
        .get(`/questions/courses/${courseId}`)
        .query({ page: 1, pageSize: 10 })
        .expect(HttpStatus.OK);

      // then
      expect(response.body.data.items).toHaveLength(0);
      expect(response.body.data.pagination.totalCount).toBe(0);
    });
  });

  describe('GET /questions/:questionId', () => {
    it('질문 상세 정보를 성공적으로 조회한다', async () => {
      // given
      const { adminId, accessToken: adminToken } = await createAdminUserAndLogin();
      const { userId, accessToken: userToken } = await createUserAndLogin('student@example.com', '학생');

      const courseId = await createCourse(adminToken, adminId);
      await createEnrollment(userId, courseId);

      const createResponse = await request(app.getHttpServer())
        .post(`/questions/courses/${courseId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: '테스트 질문',
          content: '테스트 질문 내용입니다. 충분히 긴 내용으로 작성합니다.',
        })
        .expect(HttpStatus.CREATED);

      const questionId = createResponse.body.data.id;

      // when
      const response = await request(app.getHttpServer()).get(`/questions/${questionId}`).expect(HttpStatus.OK);

      // then
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toMatchObject({
        id: questionId,
        title: '테스트 질문',
        content: '테스트 질문 내용입니다. 충분히 긴 내용으로 작성합니다.',
        userId,
        courseId,
      });
    });

    it('존재하지 않는 질문 조회 시 404 상태코드를 반환한다', async () => {
      // given
      const nonExistentQuestionId = '00000000-0000-0000-0000-000000000000';

      // when & then
      await request(app.getHttpServer()).get(`/questions/${nonExistentQuestionId}`).expect(HttpStatus.NOT_FOUND);
    });
  });

  describe('PATCH /questions/:questionId', () => {
    it('질문 작성자가 질문을 성공적으로 수정한다', async () => {
      // given
      const { adminId, accessToken: adminToken } = await createAdminUserAndLogin();
      const { userId, accessToken: userToken } = await createUserAndLogin('student@example.com', '학생');

      const courseId = await createCourse(adminToken, adminId);
      await createEnrollment(userId, courseId);

      const createResponse = await request(app.getHttpServer())
        .post(`/questions/courses/${courseId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: '원본 질문 제목',
          content: '원본 질문 내용입니다. 충분히 긴 내용으로 작성합니다.',
        })
        .expect(HttpStatus.CREATED);

      const questionId = createResponse.body.data.id;

      const updateRequest = {
        title: '수정된 질문 제목',
        content: '수정된 질문 내용입니다. 충분히 긴 내용으로 작성합니다.',
      };

      // when
      const response = await request(app.getHttpServer())
        .patch(`/questions/${questionId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateRequest)
        .expect(HttpStatus.OK);

      // then
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toMatchObject({
        id: questionId,
        title: updateRequest.title,
        content: updateRequest.content,
      });
    });

    it('다른 사용자가 질문 수정 시 403 상태코드를 반환한다', async () => {
      // given
      const { adminId, accessToken: adminToken } = await createAdminUserAndLogin();
      const { userId: user1Id, accessToken: user1Token } = await createUserAndLogin('student1@example.com', '학생1');
      const { accessToken: user2Token } = await createUserAndLogin('student2@example.com', '학생2');

      const courseId = await createCourse(adminToken, adminId);
      await createEnrollment(user1Id, courseId);

      const createResponse = await request(app.getHttpServer())
        .post(`/questions/courses/${courseId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          title: '질문 제목',
          content: '질문 내용입니다. 충분히 긴 내용으로 작성합니다.',
        })
        .expect(HttpStatus.CREATED);

      const questionId = createResponse.body.data.id;

      // when & then
      await request(app.getHttpServer())
        .patch(`/questions/${questionId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          title: '수정하려는 제목',
          content: '수정하려는 내용입니다. 충분히 긴 내용으로 작성합니다.',
        })
        .expect(HttpStatus.FORBIDDEN);
    });
  });

  describe('DELETE /questions/:questionId', () => {
    it('질문 작성자가 질문을 성공적으로 삭제한다', async () => {
      // given
      const { adminId, accessToken: adminToken } = await createAdminUserAndLogin();
      const { userId, accessToken: userToken } = await createUserAndLogin('student@example.com', '학생');

      const courseId = await createCourse(adminToken, adminId);
      await createEnrollment(userId, courseId);

      const createResponse = await request(app.getHttpServer())
        .post(`/questions/courses/${courseId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: '삭제할 질문',
          content: '삭제할 질문 내용입니다. 충분히 긴 내용으로 작성합니다.',
        })
        .expect(HttpStatus.CREATED);

      const questionId = createResponse.body.data.id;

      // when
      await request(app.getHttpServer())
        .delete(`/questions/${questionId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(HttpStatus.NO_CONTENT);

      // then - 삭제된 질문 조회 시 404
      await request(app.getHttpServer()).get(`/questions/${questionId}`).expect(HttpStatus.NOT_FOUND);
    });

    it('다른 사용자가 질문 삭제 시 403 상태코드를 반환한다', async () => {
      // given
      const { adminId, accessToken: adminToken } = await createAdminUserAndLogin();
      const { userId: user1Id, accessToken: user1Token } = await createUserAndLogin('student1@example.com', '학생1');
      const { accessToken: user2Token } = await createUserAndLogin('student2@example.com', '학생2');

      const courseId = await createCourse(adminToken, adminId);
      await createEnrollment(user1Id, courseId);

      const createResponse = await request(app.getHttpServer())
        .post(`/questions/courses/${courseId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          title: '질문 제목',
          content: '질문 내용입니다. 충분히 긴 내용으로 작성합니다.',
        })
        .expect(HttpStatus.CREATED);

      const questionId = createResponse.body.data.id;

      // when & then
      await request(app.getHttpServer())
        .delete(`/questions/${questionId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(HttpStatus.FORBIDDEN);
    });
  });

  describe('POST /questions/:questionId/answers', () => {
    it('수강생이 질문에 답변을 성공적으로 작성한다', async () => {
      // given
      const { adminId, accessToken: adminToken } = await createAdminUserAndLogin();
      const { userId: student1Id, accessToken: student1Token } = await createUserAndLogin(
        'student1@example.com',
        '학생1',
      );
      const { userId: student2Id, accessToken: student2Token } = await createUserAndLogin(
        'student2@example.com',
        '학생2',
      );

      const courseId = await createCourse(adminToken, adminId);
      await createEnrollment(student1Id, courseId);
      await createEnrollment(student2Id, courseId);

      const createQuestionResponse = await request(app.getHttpServer())
        .post(`/questions/courses/${courseId}`)
        .set('Authorization', `Bearer ${student1Token}`)
        .send({
          title: '질문 제목',
          content: '질문 내용입니다. 충분히 긴 내용으로 작성합니다.',
        })
        .expect(HttpStatus.CREATED);

      const questionId = createQuestionResponse.body.data.id;

      const createAnswerRequest = {
        content: '답변 내용입니다. 충분히 긴 내용으로 작성합니다.',
      };

      // when
      const response = await request(app.getHttpServer())
        .post(`/questions/${questionId}/answers`)
        .set('Authorization', `Bearer ${student2Token}`)
        .send(createAnswerRequest)
        .expect(HttpStatus.CREATED);

      // then
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toMatchObject({
        content: createAnswerRequest.content,
        userId: student2Id,
        questionId,
      });
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('createdAt');
    });

    it('강사가 질문에 답변을 성공적으로 작성한다', async () => {
      // given
      const { adminId, accessToken: adminToken } = await createAdminUserAndLogin();
      const { userId, accessToken: userToken } = await createUserAndLogin('student@example.com', '학생');

      const courseId = await createCourse(adminToken, adminId);
      await createEnrollment(userId, courseId);

      const createQuestionResponse = await request(app.getHttpServer())
        .post(`/questions/courses/${courseId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: '질문 제목',
          content: '질문 내용입니다. 충분히 긴 내용으로 작성합니다.',
        })
        .expect(HttpStatus.CREATED);

      const questionId = createQuestionResponse.body.data.id;

      const createAnswerRequest = {
        content: '강사가 작성한 답변입니다. 충분히 긴 내용으로 작성합니다.',
      };

      // when - 강사(관리자)가 답변 작성
      const response = await request(app.getHttpServer())
        .post(`/questions/${questionId}/answers`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(createAnswerRequest)
        .expect(HttpStatus.CREATED);

      // then
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toMatchObject({
        content: createAnswerRequest.content,
        userId: adminId,
        questionId,
      });
    });

    it('수강하지 않은 사용자가 답변 작성 시 403 상태코드를 반환한다', async () => {
      // given
      const { adminId, accessToken: adminToken } = await createAdminUserAndLogin();
      const { userId: student1Id, accessToken: student1Token } = await createUserAndLogin(
        'student1@example.com',
        '학생1',
      );
      const { accessToken: nonStudentToken } = await createUserAndLogin('nonstudent@example.com', '비수강생');

      const courseId = await createCourse(adminToken, adminId);
      await createEnrollment(student1Id, courseId);

      const createQuestionResponse = await request(app.getHttpServer())
        .post(`/questions/courses/${courseId}`)
        .set('Authorization', `Bearer ${student1Token}`)
        .send({
          title: '질문 제목',
          content: '질문 내용입니다. 충분히 긴 내용으로 작성합니다.',
        })
        .expect(HttpStatus.CREATED);

      const questionId = createQuestionResponse.body.data.id;

      // when & then
      await request(app.getHttpServer())
        .post(`/questions/${questionId}/answers`)
        .set('Authorization', `Bearer ${nonStudentToken}`)
        .send({
          content: '답변 내용입니다. 충분히 긴 내용으로 작성합니다.',
        })
        .expect(HttpStatus.FORBIDDEN);
    });
  });

  describe('GET /questions/:questionId/answers', () => {
    it('질문에 달린 답변 목록을 성공적으로 조회한다', async () => {
      // given
      const { adminId, accessToken: adminToken } = await createAdminUserAndLogin();
      const { userId: student1Id, accessToken: student1Token } = await createUserAndLogin(
        'student1@example.com',
        '학생1',
      );
      const { userId: student2Id, accessToken: student2Token } = await createUserAndLogin(
        'student2@example.com',
        '학생2',
      );

      const courseId = await createCourse(adminToken, adminId);
      await createEnrollment(student1Id, courseId);
      await createEnrollment(student2Id, courseId);

      const createQuestionResponse = await request(app.getHttpServer())
        .post(`/questions/courses/${courseId}`)
        .set('Authorization', `Bearer ${student1Token}`)
        .send({
          title: '질문 제목',
          content: '질문 내용입니다. 충분히 긴 내용으로 작성합니다.',
        })
        .expect(HttpStatus.CREATED);

      const questionId = createQuestionResponse.body.data.id;

      // 여러 답변 생성
      await request(app.getHttpServer())
        .post(`/questions/${questionId}/answers`)
        .set('Authorization', `Bearer ${student2Token}`)
        .send({
          content: '첫 번째 답변입니다. 충분히 긴 내용으로 작성합니다.',
        })
        .expect(HttpStatus.CREATED);

      await request(app.getHttpServer())
        .post(`/questions/${questionId}/answers`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          content: '두 번째 답변입니다. 충분히 긴 내용으로 작성합니다.',
        })
        .expect(HttpStatus.CREATED);

      // when
      const response = await request(app.getHttpServer()).get(`/questions/${questionId}/answers`).expect(HttpStatus.OK);

      // then
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0]).toHaveProperty('content');
      expect(response.body.data[0]).toHaveProperty('userId');
      expect(response.body.data[0]).toHaveProperty('questionId', questionId);
    });

    it('답변이 없는 질문의 답변 목록 조회 시 빈 배열을 반환한다', async () => {
      // given
      const { adminId, accessToken: adminToken } = await createAdminUserAndLogin();
      const { userId, accessToken: userToken } = await createUserAndLogin('student@example.com', '학생');

      const courseId = await createCourse(adminToken, adminId);
      await createEnrollment(userId, courseId);

      const createQuestionResponse = await request(app.getHttpServer())
        .post(`/questions/courses/${courseId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: '질문 제목',
          content: '질문 내용입니다. 충분히 긴 내용으로 작성합니다.',
        })
        .expect(HttpStatus.CREATED);

      const questionId = createQuestionResponse.body.data.id;

      // when
      const response = await request(app.getHttpServer()).get(`/questions/${questionId}/answers`).expect(HttpStatus.OK);

      // then
      expect(response.body.data).toHaveLength(0);
    });
  });

  describe('PATCH /questions/answers/:answerId', () => {
    it('답변 작성자가 답변을 성공적으로 수정한다', async () => {
      // given
      const { adminId, accessToken: adminToken } = await createAdminUserAndLogin();
      const { userId: student1Id, accessToken: student1Token } = await createUserAndLogin(
        'student1@example.com',
        '학생1',
      );
      const { userId: student2Id, accessToken: student2Token } = await createUserAndLogin(
        'student2@example.com',
        '학생2',
      );

      const courseId = await createCourse(adminToken, adminId);
      await createEnrollment(student1Id, courseId);
      await createEnrollment(student2Id, courseId);

      const createQuestionResponse = await request(app.getHttpServer())
        .post(`/questions/courses/${courseId}`)
        .set('Authorization', `Bearer ${student1Token}`)
        .send({
          title: '질문 제목',
          content: '질문 내용입니다. 충분히 긴 내용으로 작성합니다.',
        })
        .expect(HttpStatus.CREATED);

      const questionId = createQuestionResponse.body.data.id;

      const createAnswerResponse = await request(app.getHttpServer())
        .post(`/questions/${questionId}/answers`)
        .set('Authorization', `Bearer ${student2Token}`)
        .send({
          content: '원본 답변 내용입니다. 충분히 긴 내용으로 작성합니다.',
        })
        .expect(HttpStatus.CREATED);

      const answerId = createAnswerResponse.body.data.id;

      const updateRequest = {
        content: '수정된 답변 내용입니다. 충분히 긴 내용으로 작성합니다.',
      };

      // when
      const response = await request(app.getHttpServer())
        .patch(`/questions/answers/${answerId}`)
        .set('Authorization', `Bearer ${student2Token}`)
        .send(updateRequest)
        .expect(HttpStatus.OK);

      // then
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toMatchObject({
        id: answerId,
        content: updateRequest.content,
      });
    });

    it('다른 사용자가 답변 수정 시 403 상태코드를 반환한다', async () => {
      // given
      const { adminId, accessToken: adminToken } = await createAdminUserAndLogin();
      const { userId: student1Id, accessToken: student1Token } = await createUserAndLogin(
        'student1@example.com',
        '학생1',
      );
      const { userId: student2Id, accessToken: student2Token } = await createUserAndLogin(
        'student2@example.com',
        '학생2',
      );
      const { accessToken: student3Token } = await createUserAndLogin('student3@example.com', '학생3');

      const courseId = await createCourse(adminToken, adminId);
      await createEnrollment(student1Id, courseId);
      await createEnrollment(student2Id, courseId);

      const createQuestionResponse = await request(app.getHttpServer())
        .post(`/questions/courses/${courseId}`)
        .set('Authorization', `Bearer ${student1Token}`)
        .send({
          title: '질문 제목',
          content: '질문 내용입니다. 충분히 긴 내용으로 작성합니다.',
        })
        .expect(HttpStatus.CREATED);

      const questionId = createQuestionResponse.body.data.id;

      const createAnswerResponse = await request(app.getHttpServer())
        .post(`/questions/${questionId}/answers`)
        .set('Authorization', `Bearer ${student2Token}`)
        .send({
          content: '답변 내용입니다. 충분히 긴 내용으로 작성합니다.',
        })
        .expect(HttpStatus.CREATED);

      const answerId = createAnswerResponse.body.data.id;

      // when & then
      await request(app.getHttpServer())
        .patch(`/questions/answers/${answerId}`)
        .set('Authorization', `Bearer ${student3Token}`)
        .send({
          content: '수정하려는 내용입니다. 충분히 긴 내용으로 작성합니다.',
        })
        .expect(HttpStatus.FORBIDDEN);
    });
  });

  describe('DELETE /questions/answers/:answerId', () => {
    it('답변 작성자가 답변을 성공적으로 삭제한다', async () => {
      // given
      const { adminId, accessToken: adminToken } = await createAdminUserAndLogin();
      const { userId: student1Id, accessToken: student1Token } = await createUserAndLogin(
        'student1@example.com',
        '학생1',
      );
      const { userId: student2Id, accessToken: student2Token } = await createUserAndLogin(
        'student2@example.com',
        '학생2',
      );

      const courseId = await createCourse(adminToken, adminId);
      await createEnrollment(student1Id, courseId);
      await createEnrollment(student2Id, courseId);

      const createQuestionResponse = await request(app.getHttpServer())
        .post(`/questions/courses/${courseId}`)
        .set('Authorization', `Bearer ${student1Token}`)
        .send({
          title: '질문 제목',
          content: '질문 내용입니다. 충분히 긴 내용으로 작성합니다.',
        })
        .expect(HttpStatus.CREATED);

      const questionId = createQuestionResponse.body.data.id;

      const createAnswerResponse = await request(app.getHttpServer())
        .post(`/questions/${questionId}/answers`)
        .set('Authorization', `Bearer ${student2Token}`)
        .send({
          content: '삭제할 답변입니다. 충분히 긴 내용으로 작성합니다.',
        })
        .expect(HttpStatus.CREATED);

      const answerId = createAnswerResponse.body.data.id;

      // when
      await request(app.getHttpServer())
        .delete(`/questions/answers/${answerId}`)
        .set('Authorization', `Bearer ${student2Token}`)
        .expect(HttpStatus.NO_CONTENT);

      // then - 삭제된 답변은 목록에서 조회되지 않음
      const listResponse = await request(app.getHttpServer())
        .get(`/questions/${questionId}/answers`)
        .expect(HttpStatus.OK);

      expect(listResponse.body.data).toHaveLength(0);
    });

    it('다른 사용자가 답변 삭제 시 403 상태코드를 반환한다', async () => {
      // given
      const { adminId, accessToken: adminToken } = await createAdminUserAndLogin();
      const { userId: student1Id, accessToken: student1Token } = await createUserAndLogin(
        'student1@example.com',
        '학생1',
      );
      const { userId: student2Id, accessToken: student2Token } = await createUserAndLogin(
        'student2@example.com',
        '학생2',
      );
      const { accessToken: student3Token } = await createUserAndLogin('student3@example.com', '학생3');

      const courseId = await createCourse(adminToken, adminId);
      await createEnrollment(student1Id, courseId);
      await createEnrollment(student2Id, courseId);

      const createQuestionResponse = await request(app.getHttpServer())
        .post(`/questions/courses/${courseId}`)
        .set('Authorization', `Bearer ${student1Token}`)
        .send({
          title: '질문 제목',
          content: '질문 내용입니다. 충분히 긴 내용으로 작성합니다.',
        })
        .expect(HttpStatus.CREATED);

      const questionId = createQuestionResponse.body.data.id;

      const createAnswerResponse = await request(app.getHttpServer())
        .post(`/questions/${questionId}/answers`)
        .set('Authorization', `Bearer ${student2Token}`)
        .send({
          content: '답변 내용입니다. 충분히 긴 내용으로 작성합니다.',
        })
        .expect(HttpStatus.CREATED);

      const answerId = createAnswerResponse.body.data.id;

      // when & then
      await request(app.getHttpServer())
        .delete(`/questions/answers/${answerId}`)
        .set('Authorization', `Bearer ${student3Token}`)
        .expect(HttpStatus.FORBIDDEN);
    });
  });
});
