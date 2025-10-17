import { TestHelper } from '@test/integration/test-helper';
import request from 'supertest';

import { HttpStatus, INestApplication } from '@nestjs/common';

import { CourseLevel, CourseStatus } from '@prisma/client';

describe('SectionController (Integration)', () => {
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
    await request(app.getHttpServer())
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

    return loginResponse.body.data.accessToken;
  };

  // 테스트용 코스 생성 헬퍼 함수
  const createTestCourse = async (adminId: string) => {
    const prisma = TestHelper.getPrisma();
    return await prisma.course.create({
      data: {
        slug: 'test-course',
        title: '테스트 코스',
        description: '테스트용 코스입니다',
        instructorId: adminId,
        level: CourseLevel.BEGINNER,
        status: CourseStatus.DRAFT,
      },
    });
  };

  describe('POST /courses/:courseId/sections', () => {
    it('관리자가 유효한 데이터로 섹션 생성 시 201 상태코드와 섹션 정보를 반환한다', async () => {
      // given
      const { adminId, accessToken } = await createAdminUserAndLogin();
      const course = await createTestCourse(adminId);

      const createSectionRequest = {
        title: '1. 시작하기',
        order: 1,
      };

      // when
      const response = await request(app.getHttpServer())
        .post(`/courses/${course.id}/sections`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(createSectionRequest)
        .expect(HttpStatus.CREATED);

      // then
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toMatchObject({
        title: createSectionRequest.title,
        order: createSectionRequest.order,
        courseId: course.id,
      });
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('createdAt');
      expect(response.body.data).toHaveProperty('updatedAt');
    });

    it('인증되지 않은 사용자가 섹션 생성 시 401 상태코드를 반환한다', async () => {
      // given
      const { adminId } = await createAdminUserAndLogin();
      const course = await createTestCourse(adminId);

      const createSectionRequest = {
        title: '1. 시작하기',
        order: 1,
      };

      // when & then
      await request(app.getHttpServer())
        .post(`/courses/${course.id}/sections`)
        .send(createSectionRequest)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('일반 사용자가 섹션 생성 시 403 상태코드를 반환한다', async () => {
      // given
      const { adminId } = await createAdminUserAndLogin();
      const course = await createTestCourse(adminId);
      const userAccessToken = await createUserAndLogin();

      const createSectionRequest = {
        title: '1. 시작하기',
        order: 1,
      };

      // when & then
      await request(app.getHttpServer())
        .post(`/courses/${course.id}/sections`)
        .set('Authorization', `Bearer ${userAccessToken}`)
        .send(createSectionRequest)
        .expect(HttpStatus.FORBIDDEN);
    });

    it('존재하지 않는 코스에 섹션 생성 시 404 상태코드를 반환한다', async () => {
      // given
      const { accessToken } = await createAdminUserAndLogin();

      const createSectionRequest = {
        title: '1. 시작하기',
        order: 1,
      };

      // when & then
      await request(app.getHttpServer())
        .post('/courses/non-existent-id/sections')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(createSectionRequest)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('제목이 없으면 400 상태코드를 반환한다', async () => {
      // given
      const { adminId, accessToken } = await createAdminUserAndLogin();
      const course = await createTestCourse(adminId);

      const createSectionRequest = {
        order: 1,
      };

      // when & then
      await request(app.getHttpServer())
        .post(`/courses/${course.id}/sections`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(createSectionRequest)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('순서가 없으면 400 상태코드를 반환한다', async () => {
      // given
      const { adminId, accessToken } = await createAdminUserAndLogin();
      const course = await createTestCourse(adminId);

      const createSectionRequest = {
        title: '1. 시작하기',
      };

      // when & then
      await request(app.getHttpServer())
        .post(`/courses/${course.id}/sections`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(createSectionRequest)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('순서가 음수이면 400 상태코드를 반환한다', async () => {
      // given
      const { adminId, accessToken } = await createAdminUserAndLogin();
      const course = await createTestCourse(adminId);

      const createSectionRequest = {
        title: '1. 시작하기',
        order: -1,
      };

      // when & then
      await request(app.getHttpServer())
        .post(`/courses/${course.id}/sections`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(createSectionRequest)
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  describe('PATCH /courses/:courseId/sections/:id', () => {
    it('관리자가 유효한 데이터로 섹션 수정 시 200 상태코드와 수정된 섹션 정보를 반환한다', async () => {
      // given
      const { adminId, accessToken } = await createAdminUserAndLogin();
      const course = await createTestCourse(adminId);

      const prisma = TestHelper.getPrisma();
      const section = await prisma.section.create({
        data: {
          title: '1. 시작하기',
          order: 1,
          courseId: course.id,
        },
      });

      const updateSectionRequest = {
        title: '1. 개요',
        order: 2,
      };

      // when
      const response = await request(app.getHttpServer())
        .patch(`/courses/${course.id}/sections/${section.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateSectionRequest)
        .expect(HttpStatus.OK);

      // then
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toMatchObject({
        id: section.id,
        title: updateSectionRequest.title,
        order: updateSectionRequest.order,
        courseId: course.id,
      });
    });

    it('제목만 수정할 수 있다', async () => {
      // given
      const { adminId, accessToken } = await createAdminUserAndLogin();
      const course = await createTestCourse(adminId);

      const prisma = TestHelper.getPrisma();
      const section = await prisma.section.create({
        data: {
          title: '1. 시작하기',
          order: 1,
          courseId: course.id,
        },
      });

      const updateSectionRequest = {
        title: '1. 개요',
      };

      // when
      const response = await request(app.getHttpServer())
        .patch(`/courses/${course.id}/sections/${section.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateSectionRequest)
        .expect(HttpStatus.OK);

      // then
      expect(response.body.data).toMatchObject({
        id: section.id,
        title: updateSectionRequest.title,
        order: 1, // 원래 순서 유지
        courseId: course.id,
      });
    });

    it('순서만 수정할 수 있다', async () => {
      // given
      const { adminId, accessToken } = await createAdminUserAndLogin();
      const course = await createTestCourse(adminId);

      const prisma = TestHelper.getPrisma();
      const section = await prisma.section.create({
        data: {
          title: '1. 시작하기',
          order: 1,
          courseId: course.id,
        },
      });

      const updateSectionRequest = {
        order: 2,
      };

      // when
      const response = await request(app.getHttpServer())
        .patch(`/courses/${course.id}/sections/${section.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateSectionRequest)
        .expect(HttpStatus.OK);

      // then
      expect(response.body.data).toMatchObject({
        id: section.id,
        title: '1. 시작하기', // 원래 제목 유지
        order: updateSectionRequest.order,
        courseId: course.id,
      });
    });

    it('인증되지 않은 사용자가 섹션 수정 시 401 상태코드를 반환한다', async () => {
      // given
      const { adminId } = await createAdminUserAndLogin();
      const course = await createTestCourse(adminId);

      const prisma = TestHelper.getPrisma();
      const section = await prisma.section.create({
        data: {
          title: '1. 시작하기',
          order: 1,
          courseId: course.id,
        },
      });

      const updateSectionRequest = {
        title: '1. 개요',
      };

      // when & then
      await request(app.getHttpServer())
        .patch(`/courses/${course.id}/sections/${section.id}`)
        .send(updateSectionRequest)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('일반 사용자가 섹션 수정 시 403 상태코드를 반환한다', async () => {
      // given
      const { adminId } = await createAdminUserAndLogin();
      const course = await createTestCourse(adminId);
      const userAccessToken = await createUserAndLogin();

      const prisma = TestHelper.getPrisma();
      const section = await prisma.section.create({
        data: {
          title: '1. 시작하기',
          order: 1,
          courseId: course.id,
        },
      });

      const updateSectionRequest = {
        title: '1. 개요',
      };

      // when & then
      await request(app.getHttpServer())
        .patch(`/courses/${course.id}/sections/${section.id}`)
        .set('Authorization', `Bearer ${userAccessToken}`)
        .send(updateSectionRequest)
        .expect(HttpStatus.FORBIDDEN);
    });

    it('존재하지 않는 섹션 수정 시 404 상태코드를 반환한다', async () => {
      // given
      const { adminId, accessToken } = await createAdminUserAndLogin();
      const course = await createTestCourse(adminId);

      const updateSectionRequest = {
        title: '1. 개요',
      };

      // when & then
      await request(app.getHttpServer())
        .patch(`/courses/${course.id}/sections/non-existent-id`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateSectionRequest)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('순서가 음수이면 400 상태코드를 반환한다', async () => {
      // given
      const { adminId, accessToken } = await createAdminUserAndLogin();
      const course = await createTestCourse(adminId);

      const prisma = TestHelper.getPrisma();
      const section = await prisma.section.create({
        data: {
          title: '1. 시작하기',
          order: 1,
          courseId: course.id,
        },
      });

      const updateSectionRequest = {
        order: -1,
      };

      // when & then
      await request(app.getHttpServer())
        .patch(`/courses/${course.id}/sections/${section.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateSectionRequest)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('빈 제목으로 수정 시 400 상태코드를 반환한다', async () => {
      // given
      const { adminId, accessToken } = await createAdminUserAndLogin();
      const course = await createTestCourse(adminId);

      const prisma = TestHelper.getPrisma();
      const section = await prisma.section.create({
        data: {
          title: '1. 시작하기',
          order: 1,
          courseId: course.id,
        },
      });

      const updateSectionRequest = {
        title: '',
      };

      // when & then
      await request(app.getHttpServer())
        .patch(`/courses/${course.id}/sections/${section.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateSectionRequest)
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  describe('DELETE /courses/:courseId/sections/:id', () => {
    it('관리자가 섹션 삭제 시 204 상태코드를 반환한다', async () => {
      // given
      const { adminId, accessToken } = await createAdminUserAndLogin();
      const course = await createTestCourse(adminId);

      const prisma = TestHelper.getPrisma();
      const section = await prisma.section.create({
        data: {
          title: '1. 시작하기',
          order: 1,
          courseId: course.id,
        },
      });

      // when
      await request(app.getHttpServer())
        .delete(`/courses/${course.id}/sections/${section.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(HttpStatus.NO_CONTENT);

      // then - 소프트 삭제 확인
      const deletedSection = await prisma.section.findUnique({
        where: { id: section.id },
      });
      expect(deletedSection).not.toBeNull();
      expect(deletedSection?.deletedAt).not.toBeNull();
    });

    it('인증되지 않은 사용자가 섹션 삭제 시 401 상태코드를 반환한다', async () => {
      // given
      const { adminId } = await createAdminUserAndLogin();
      const course = await createTestCourse(adminId);

      const prisma = TestHelper.getPrisma();
      const section = await prisma.section.create({
        data: {
          title: '1. 시작하기',
          order: 1,
          courseId: course.id,
        },
      });

      // when & then
      await request(app.getHttpServer())
        .delete(`/courses/${course.id}/sections/${section.id}`)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('일반 사용자가 섹션 삭제 시 403 상태코드를 반환한다', async () => {
      // given
      const { adminId } = await createAdminUserAndLogin();
      const course = await createTestCourse(adminId);
      const userAccessToken = await createUserAndLogin();

      const prisma = TestHelper.getPrisma();
      const section = await prisma.section.create({
        data: {
          title: '1. 시작하기',
          order: 1,
          courseId: course.id,
        },
      });

      // when & then
      await request(app.getHttpServer())
        .delete(`/courses/${course.id}/sections/${section.id}`)
        .set('Authorization', `Bearer ${userAccessToken}`)
        .expect(HttpStatus.FORBIDDEN);
    });

    it('존재하지 않는 섹션 삭제 시 404 상태코드를 반환한다', async () => {
      // given
      const { adminId, accessToken } = await createAdminUserAndLogin();
      const course = await createTestCourse(adminId);

      // when & then
      await request(app.getHttpServer())
        .delete(`/courses/${course.id}/sections/non-existent-id`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('이미 삭제된 섹션 삭제 시 404 상태코드를 반환한다', async () => {
      // given
      const { adminId, accessToken } = await createAdminUserAndLogin();
      const course = await createTestCourse(adminId);

      const prisma = TestHelper.getPrisma();
      const section = await prisma.section.create({
        data: {
          title: '1. 시작하기',
          order: 1,
          courseId: course.id,
          deletedAt: new Date(), // 이미 삭제된 상태
        },
      });

      // when & then
      await request(app.getHttpServer())
        .delete(`/courses/${course.id}/sections/${section.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(HttpStatus.NOT_FOUND);
    });
  });
});
