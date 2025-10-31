import { TestHelper } from '@test/integration/test-helper';
import request from 'supertest';

import { HttpStatus, INestApplication } from '@nestjs/common';

import { CourseLevel, CourseStatus } from '@prisma/client';

describe('LectureController (Integration)', () => {
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

  // 테스트용 섹션 생성 헬퍼 함수
  const createTestSection = async (courseId: string) => {
    const prisma = TestHelper.getPrisma();
    return await prisma.section.create({
      data: {
        title: '1. 시작하기',
        order: 1,
        courseId,
      },
    });
  };

  describe('POST /courses/:courseId/lectures', () => {
    it('관리자가 유효한 데이터로 강의 생성 시 201 상태코드와 강의 정보를 반환한다', async () => {
      // given
      const { adminId, accessToken } = await createAdminUserAndLogin();
      const course = await createTestCourse(adminId);
      const section = await createTestSection(course.id);

      const createLectureRequest = {
        title: '1. TypeScript 기초',
        description: 'TypeScript의 기본 문법을 배웁니다.',
        order: 1,
        duration: 600,
        isPreview: false,
        sectionId: section.id,
      };

      // when
      const response = await request(app.getHttpServer())
        .post(`/courses/${course.id}/lectures`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(createLectureRequest)
        .expect(HttpStatus.CREATED);

      // then
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toMatchObject({
        title: createLectureRequest.title,
        description: createLectureRequest.description,
        order: createLectureRequest.order,
        duration: createLectureRequest.duration,
        isPreview: createLectureRequest.isPreview,
        sectionId: section.id,
        courseId: course.id,
      });
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('createdAt');
      expect(response.body.data).toHaveProperty('updatedAt');
    });

    it('필수 필드만으로 강의 생성 가능하다', async () => {
      // given
      const { adminId, accessToken } = await createAdminUserAndLogin();
      const course = await createTestCourse(adminId);
      const section = await createTestSection(course.id);

      const createLectureRequest = {
        title: '1. TypeScript 기초',
        order: 1,
        sectionId: section.id,
      };

      // when
      const response = await request(app.getHttpServer())
        .post(`/courses/${course.id}/lectures`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(createLectureRequest)
        .expect(HttpStatus.CREATED);

      // then
      expect(response.body.data).toMatchObject({
        title: createLectureRequest.title,
        order: createLectureRequest.order,
        sectionId: section.id,
        courseId: course.id,
        description: null,
        duration: null,
        isPreview: false,
        videoUrl: null,
      });
    });

    it('videoUrl을 저장할 수 있다', async () => {
      // given
      const { adminId, accessToken } = await createAdminUserAndLogin();
      const course = await createTestCourse(adminId);
      const section = await createTestSection(course.id);

      const videoUrl = 'https://example.com/video.mp4';
      const createLectureRequest = {
        title: '1. TypeScript 기초',
        order: 1,
        sectionId: section.id,
        videoUrl,
      };

      // when
      const response = await request(app.getHttpServer())
        .post(`/courses/${course.id}/lectures`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(createLectureRequest)
        .expect(HttpStatus.CREATED);

      // then
      expect(response.body.data.videoUrl).toBe(videoUrl);
    });

    it('인증되지 않은 사용자가 강의 생성 시 401 상태코드를 반환한다', async () => {
      // given
      const { adminId } = await createAdminUserAndLogin();
      const course = await createTestCourse(adminId);
      const section = await createTestSection(course.id);

      const createLectureRequest = {
        title: '1. TypeScript 기초',
        order: 1,
        sectionId: section.id,
      };

      // when & then
      await request(app.getHttpServer())
        .post(`/courses/${course.id}/lectures`)
        .send(createLectureRequest)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('일반 사용자가 강의 생성 시 403 상태코드를 반환한다', async () => {
      // given
      const { adminId } = await createAdminUserAndLogin();
      const course = await createTestCourse(adminId);
      const section = await createTestSection(course.id);
      const userAccessToken = await createUserAndLogin();

      const createLectureRequest = {
        title: '1. TypeScript 기초',
        order: 1,
        sectionId: section.id,
      };

      // when & then
      await request(app.getHttpServer())
        .post(`/courses/${course.id}/lectures`)
        .set('Authorization', `Bearer ${userAccessToken}`)
        .send(createLectureRequest)
        .expect(HttpStatus.FORBIDDEN);
    });

    it('존재하지 않는 코스에 강의 생성 시 404 상태코드를 반환한다', async () => {
      // given
      const { adminId, accessToken } = await createAdminUserAndLogin();
      const course = await createTestCourse(adminId);
      const section = await createTestSection(course.id);

      const createLectureRequest = {
        title: '1. TypeScript 기초',
        order: 1,
        sectionId: section.id,
      };

      const nonExistentCourseId = '00000000-0000-0000-0000-000000000000';

      // when & then
      await request(app.getHttpServer())
        .post(`/courses/${nonExistentCourseId}/lectures`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(createLectureRequest)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('존재하지 않는 섹션에 강의 생성 시 404 상태코드를 반환한다', async () => {
      // given
      const { adminId, accessToken } = await createAdminUserAndLogin();
      const course = await createTestCourse(adminId);

      const nonExistentSectionId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'; // 유효한 UUID v4
      const createLectureRequest = {
        title: '1. TypeScript 기초',
        order: 1,
        sectionId: nonExistentSectionId,
      };

      // when & then
      await request(app.getHttpServer())
        .post(`/courses/${course.id}/lectures`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(createLectureRequest)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('다른 코스의 섹션에 강의 생성 시 400 상태코드를 반환한다', async () => {
      // given
      const { adminId, accessToken } = await createAdminUserAndLogin();
      const course1 = await createTestCourse(adminId);

      const prisma = TestHelper.getPrisma();
      const course2 = await prisma.course.create({
        data: {
          slug: 'test-course-2',
          title: '테스트 코스 2',
          description: '테스트용 코스입니다 2',
          instructorId: adminId,
          level: CourseLevel.BEGINNER,
          status: CourseStatus.DRAFT,
        },
      });
      const section2 = await createTestSection(course2.id);

      const createLectureRequest = {
        title: '1. TypeScript 기초',
        order: 1,
        sectionId: section2.id, // course2의 섹션
      };

      // when & then
      await request(app.getHttpServer())
        .post(`/courses/${course1.id}/lectures`) // course1에 생성 시도
        .set('Authorization', `Bearer ${accessToken}`)
        .send(createLectureRequest)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('제목이 없으면 400 상태코드를 반환한다', async () => {
      // given
      const { adminId, accessToken } = await createAdminUserAndLogin();
      const course = await createTestCourse(adminId);
      const section = await createTestSection(course.id);

      const createLectureRequest = {
        order: 1,
        sectionId: section.id,
      };

      // when & then
      await request(app.getHttpServer())
        .post(`/courses/${course.id}/lectures`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(createLectureRequest)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('순서가 없으면 400 상태코드를 반환한다', async () => {
      // given
      const { adminId, accessToken } = await createAdminUserAndLogin();
      const course = await createTestCourse(adminId);
      const section = await createTestSection(course.id);

      const createLectureRequest = {
        title: '1. TypeScript 기초',
        sectionId: section.id,
      };

      // when & then
      await request(app.getHttpServer())
        .post(`/courses/${course.id}/lectures`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(createLectureRequest)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('sectionId가 없으면 400 상태코드를 반환한다', async () => {
      // given
      const { adminId, accessToken } = await createAdminUserAndLogin();
      const course = await createTestCourse(adminId);

      const createLectureRequest = {
        title: '1. TypeScript 기초',
        order: 1,
      };

      // when & then
      await request(app.getHttpServer())
        .post(`/courses/${course.id}/lectures`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(createLectureRequest)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('순서가 음수이면 400 상태코드를 반환한다', async () => {
      // given
      const { adminId, accessToken } = await createAdminUserAndLogin();
      const course = await createTestCourse(adminId);
      const section = await createTestSection(course.id);

      const createLectureRequest = {
        title: '1. TypeScript 기초',
        order: -1,
        sectionId: section.id,
      };

      // when & then
      await request(app.getHttpServer())
        .post(`/courses/${course.id}/lectures`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(createLectureRequest)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('duration이 음수이면 400 상태코드를 반환한다', async () => {
      // given
      const { adminId, accessToken } = await createAdminUserAndLogin();
      const course = await createTestCourse(adminId);
      const section = await createTestSection(course.id);

      const createLectureRequest = {
        title: '1. TypeScript 기초',
        order: 1,
        sectionId: section.id,
        duration: -100,
      };

      // when & then
      await request(app.getHttpServer())
        .post(`/courses/${course.id}/lectures`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(createLectureRequest)
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  describe('PATCH /courses/:courseId/lectures/:id', () => {
    it('관리자가 유효한 데이터로 강의 수정 시 200 상태코드와 수정된 강의 정보를 반환한다', async () => {
      // given
      const { adminId, accessToken } = await createAdminUserAndLogin();
      const course = await createTestCourse(adminId);
      const section = await createTestSection(course.id);

      const prisma = TestHelper.getPrisma();
      const lecture = await prisma.lecture.create({
        data: {
          title: '1. TypeScript 기초',
          order: 1,
          sectionId: section.id,
          courseId: course.id,
        },
      });

      const updateLectureRequest = {
        title: '1. TypeScript 심화',
        description: '업데이트된 설명',
        order: 2,
        duration: 900,
        isPreview: true,
      };

      // when
      const response = await request(app.getHttpServer())
        .patch(`/courses/${course.id}/lectures/${lecture.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateLectureRequest)
        .expect(HttpStatus.OK);

      // then
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toMatchObject({
        id: lecture.id,
        title: updateLectureRequest.title,
        description: updateLectureRequest.description,
        order: updateLectureRequest.order,
        duration: updateLectureRequest.duration,
        isPreview: updateLectureRequest.isPreview,
        sectionId: section.id,
        courseId: course.id,
      });
    });

    it('제목만 수정할 수 있다', async () => {
      // given
      const { adminId, accessToken } = await createAdminUserAndLogin();
      const course = await createTestCourse(adminId);
      const section = await createTestSection(course.id);

      const prisma = TestHelper.getPrisma();
      const lecture = await prisma.lecture.create({
        data: {
          title: '1. TypeScript 기초',
          description: '원래 설명',
          order: 1,
          duration: 600,
          isPreview: false,
          sectionId: section.id,
          courseId: course.id,
        },
      });

      const updateLectureRequest = {
        title: '1. TypeScript 심화',
      };

      // when
      const response = await request(app.getHttpServer())
        .patch(`/courses/${course.id}/lectures/${lecture.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateLectureRequest)
        .expect(HttpStatus.OK);

      // then
      expect(response.body.data).toMatchObject({
        id: lecture.id,
        title: updateLectureRequest.title,
        description: '원래 설명',
        order: 1,
        duration: 600,
        isPreview: false,
      });
    });

    it('videoUrl을 수정할 수 있다', async () => {
      // given
      const { adminId, accessToken } = await createAdminUserAndLogin();
      const course = await createTestCourse(adminId);
      const section = await createTestSection(course.id);

      const prisma = TestHelper.getPrisma();
      const lecture = await prisma.lecture.create({
        data: {
          title: '1. TypeScript 기초',
          order: 1,
          sectionId: section.id,
          courseId: course.id,
        },
      });

      const newVideoUrl = 'https://example.com/new-video.mp4';
      const updateLectureRequest = {
        videoUrl: newVideoUrl,
      };

      // when
      const response = await request(app.getHttpServer())
        .patch(`/courses/${course.id}/lectures/${lecture.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateLectureRequest)
        .expect(HttpStatus.OK);

      // then
      expect(response.body.data.videoUrl).toBe(newVideoUrl);
    });

    it('인증되지 않은 사용자가 강의 수정 시 401 상태코드를 반환한다', async () => {
      // given
      const { adminId } = await createAdminUserAndLogin();
      const course = await createTestCourse(adminId);
      const section = await createTestSection(course.id);

      const prisma = TestHelper.getPrisma();
      const lecture = await prisma.lecture.create({
        data: {
          title: '1. TypeScript 기초',
          order: 1,
          sectionId: section.id,
          courseId: course.id,
        },
      });

      const updateLectureRequest = {
        title: '1. TypeScript 심화',
      };

      // when & then
      await request(app.getHttpServer())
        .patch(`/courses/${course.id}/lectures/${lecture.id}`)
        .send(updateLectureRequest)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('일반 사용자가 강의 수정 시 403 상태코드를 반환한다', async () => {
      // given
      const { adminId } = await createAdminUserAndLogin();
      const course = await createTestCourse(adminId);
      const section = await createTestSection(course.id);
      const userAccessToken = await createUserAndLogin();

      const prisma = TestHelper.getPrisma();
      const lecture = await prisma.lecture.create({
        data: {
          title: '1. TypeScript 기초',
          order: 1,
          sectionId: section.id,
          courseId: course.id,
        },
      });

      const updateLectureRequest = {
        title: '1. TypeScript 심화',
      };

      // when & then
      await request(app.getHttpServer())
        .patch(`/courses/${course.id}/lectures/${lecture.id}`)
        .set('Authorization', `Bearer ${userAccessToken}`)
        .send(updateLectureRequest)
        .expect(HttpStatus.FORBIDDEN);
    });

    it('존재하지 않는 강의 수정 시 404 상태코드를 반환한다', async () => {
      // given
      const { adminId, accessToken } = await createAdminUserAndLogin();
      const course = await createTestCourse(adminId);

      const updateLectureRequest = {
        title: '1. TypeScript 심화',
      };

      // when & then
      await request(app.getHttpServer())
        .patch(`/courses/${course.id}/lectures/non-existent-id`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateLectureRequest)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('순서가 음수이면 400 상태코드를 반환한다', async () => {
      // given
      const { adminId, accessToken } = await createAdminUserAndLogin();
      const course = await createTestCourse(adminId);
      const section = await createTestSection(course.id);

      const prisma = TestHelper.getPrisma();
      const lecture = await prisma.lecture.create({
        data: {
          title: '1. TypeScript 기초',
          order: 1,
          sectionId: section.id,
          courseId: course.id,
        },
      });

      const updateLectureRequest = {
        order: -1,
      };

      // when & then
      await request(app.getHttpServer())
        .patch(`/courses/${course.id}/lectures/${lecture.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateLectureRequest)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('빈 제목으로 수정 시 400 상태코드를 반환한다', async () => {
      // given
      const { adminId, accessToken } = await createAdminUserAndLogin();
      const course = await createTestCourse(adminId);
      const section = await createTestSection(course.id);

      const prisma = TestHelper.getPrisma();
      const lecture = await prisma.lecture.create({
        data: {
          title: '1. TypeScript 기초',
          order: 1,
          sectionId: section.id,
          courseId: course.id,
        },
      });

      const updateLectureRequest = {
        title: '',
      };

      // when & then
      await request(app.getHttpServer())
        .patch(`/courses/${course.id}/lectures/${lecture.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateLectureRequest)
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  describe('DELETE /courses/:courseId/lectures/:id', () => {
    it('관리자가 강의 삭제 시 204 상태코드를 반환한다', async () => {
      // given
      const { adminId, accessToken } = await createAdminUserAndLogin();
      const course = await createTestCourse(adminId);
      const section = await createTestSection(course.id);

      const prisma = TestHelper.getPrisma();
      const lecture = await prisma.lecture.create({
        data: {
          title: '1. TypeScript 기초',
          order: 1,
          sectionId: section.id,
          courseId: course.id,
        },
      });

      // when
      await request(app.getHttpServer())
        .delete(`/courses/${course.id}/lectures/${lecture.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(HttpStatus.NO_CONTENT);

      // then - 소프트 삭제 확인
      const deletedLecture = await prisma.lecture.findUnique({
        where: { id: lecture.id },
      });
      expect(deletedLecture).not.toBeNull();
      expect(deletedLecture?.deletedAt).not.toBeNull();
    });

    it('인증되지 않은 사용자가 강의 삭제 시 401 상태코드를 반환한다', async () => {
      // given
      const { adminId } = await createAdminUserAndLogin();
      const course = await createTestCourse(adminId);
      const section = await createTestSection(course.id);

      const prisma = TestHelper.getPrisma();
      const lecture = await prisma.lecture.create({
        data: {
          title: '1. TypeScript 기초',
          order: 1,
          sectionId: section.id,
          courseId: course.id,
        },
      });

      // when & then
      await request(app.getHttpServer())
        .delete(`/courses/${course.id}/lectures/${lecture.id}`)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('일반 사용자가 강의 삭제 시 403 상태코드를 반환한다', async () => {
      // given
      const { adminId } = await createAdminUserAndLogin();
      const course = await createTestCourse(adminId);
      const section = await createTestSection(course.id);
      const userAccessToken = await createUserAndLogin();

      const prisma = TestHelper.getPrisma();
      const lecture = await prisma.lecture.create({
        data: {
          title: '1. TypeScript 기초',
          order: 1,
          sectionId: section.id,
          courseId: course.id,
        },
      });

      // when & then
      await request(app.getHttpServer())
        .delete(`/courses/${course.id}/lectures/${lecture.id}`)
        .set('Authorization', `Bearer ${userAccessToken}`)
        .expect(HttpStatus.FORBIDDEN);
    });

    it('존재하지 않는 강의 삭제 시 404 상태코드를 반환한다', async () => {
      // given
      const { adminId, accessToken } = await createAdminUserAndLogin();
      const course = await createTestCourse(adminId);

      // when & then
      await request(app.getHttpServer())
        .delete(`/courses/${course.id}/lectures/non-existent-id`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('이미 삭제된 강의 삭제 시 404 상태코드를 반환한다', async () => {
      // given
      const { adminId, accessToken } = await createAdminUserAndLogin();
      const course = await createTestCourse(adminId);
      const section = await createTestSection(course.id);

      const prisma = TestHelper.getPrisma();
      const lecture = await prisma.lecture.create({
        data: {
          title: '1. TypeScript 기초',
          order: 1,
          sectionId: section.id,
          courseId: course.id,
          deletedAt: new Date(), // 이미 삭제된 상태
        },
      });

      // when & then
      await request(app.getHttpServer())
        .delete(`/courses/${course.id}/lectures/${lecture.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(HttpStatus.NOT_FOUND);
    });
  });
});
