import { TestHelper } from '@test/integration/test-helper';
import request from 'supertest';

import { HttpStatus, INestApplication } from '@nestjs/common';

import { CourseLevel } from '@prisma/client';

describe('EnrollmentController (Integration)', () => {
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

  // 일반 사용자 생성 및 로그인 헬퍼 함수
  const createUserAndLogin = async (email: string, nickname: string, password: string) => {
    const prisma = TestHelper.getPrisma();

    await request(app.getHttpServer())
      .post('/users')
      .send({
        email,
        password,
        nickname,
      })
      .expect(HttpStatus.CREATED);

    const user = await prisma.user.findFirst({
      where: { email },
    });

    if (!user) {
      throw new Error('User not found after creation');
    }

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/signin')
      .send({
        email,
        password,
      })
      .expect(HttpStatus.OK);

    return {
      userId: user.id,
      accessToken: loginResponse.body.data.accessToken,
    };
  };

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

  // 코스 생성 헬퍼 함수
  const createCourse = async (adminAccessToken: string, slug: string, title: string) => {
    const response = await request(app.getHttpServer())
      .post('/courses')
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send({
        slug,
        title,
        description: `${title} 설명`,
        price: 49000,
        level: CourseLevel.BASIC,
      })
      .expect(HttpStatus.CREATED);

    return response.body.data;
  };

  // 섹션 생성 헬퍼 함수
  const createSection = async (adminAccessToken: string, courseId: string, title: string, order: number) => {
    const response = await request(app.getHttpServer())
      .post(`/courses/${courseId}/sections`)
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send({
        title,
        order,
      })
      .expect(HttpStatus.CREATED);

    return response.body.data;
  };

  // 강의 생성 헬퍼 함수
  const createLecture = async (
    adminAccessToken: string,
    courseId: string,
    sectionId: string,
    title: string,
    order: number,
  ) => {
    const response = await request(app.getHttpServer())
      .post(`/courses/${courseId}/lectures`)
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send({
        title,
        description: `${title} 설명`,
        order,
        duration: 600,
        videoUrl: 'https://example.com/video.mp4',
        sectionId,
      })
      .expect(HttpStatus.CREATED);

    return response.body.data;
  };

  // 수강 신청 헬퍼 함수
  const createEnrollment = async (userId: string, courseId: string) => {
    const prisma = TestHelper.getPrisma();
    const enrollment = await prisma.enrollment.create({
      data: {
        userId,
        courseId,
      },
    });
    return enrollment;
  };

  describe('GET /enrollments', () => {
    it('사용자의 수강 중인 강의 목록을 조회한다', async () => {
      // given
      const { userId, accessToken } = await createUserAndLogin('user@example.com', '일반유저', 'UserPassword123!');
      const { accessToken: adminAccessToken } = await createAdminUserAndLogin();

      // 2개의 코스 생성
      const course1 = await createCourse(adminAccessToken, 'course-1', 'Course 1');
      const course2 = await createCourse(adminAccessToken, 'course-2', 'Course 2');

      // 수강 신청
      await createEnrollment(userId, course1.id);
      await createEnrollment(userId, course2.id);

      // when
      const response = await request(app.getHttpServer())
        .get('/enrollments')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(HttpStatus.OK);

      // then
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0]).toHaveProperty('enrollment');
      expect(response.body.data[0]).toHaveProperty('course');
      expect(response.body.data[0].enrollment).toMatchObject({
        userId,
        courseId: course2.id, // 최신순으로 정렬
        progress: 0,
        isCompleted: false,
      });
    });

    it('수강 중인 강의가 없으면 빈 배열을 반환한다', async () => {
      // given
      const { accessToken } = await createUserAndLogin('user@example.com', '일반유저', 'UserPassword123!');

      // when
      const response = await request(app.getHttpServer())
        .get('/enrollments')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(HttpStatus.OK);

      // then
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveLength(0);
    });
  });

  describe('GET /enrollments/:enrollmentId/course', () => {
    it('수강 중인 강의의 상세 정보를 조회한다 (비디오 URL 포함)', async () => {
      // given
      const { userId, accessToken } = await createUserAndLogin('user@example.com', '일반유저', 'UserPassword123!');
      const { accessToken: adminAccessToken } = await createAdminUserAndLogin();

      // 코스 생성
      const course = await createCourse(adminAccessToken, 'test-course', 'Test Course');

      // 섹션 생성
      const section = await createSection(adminAccessToken, course.id, 'Section 1', 1);

      // 강의 생성
      await createLecture(adminAccessToken, course.id, section.id, 'Lecture 1', 1);
      await createLecture(adminAccessToken, course.id, section.id, 'Lecture 2', 2);

      // 수강 신청
      const enrollment = await createEnrollment(userId, course.id);

      // when
      const response = await request(app.getHttpServer())
        .get(`/enrollments/${enrollment.id}/course`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(HttpStatus.OK);

      // then
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toMatchObject({
        id: course.id,
        slug: 'test-course',
        title: 'Test Course',
      });
      expect(response.body.data.sections).toHaveLength(1);
      expect(response.body.data.sections[0].lectures).toHaveLength(2);
      expect(response.body.data.sections[0].lectures[0]).toHaveProperty('videoUrl');
      expect(response.body.data.sections[0].lectures[0].videoUrl).toBe('https://example.com/video.mp4');
    });

    it('다른 사용자의 수강 정보 조회 시 403 에러를 반환한다', async () => {
      // given
      const { userId: userId1 } = await createUserAndLogin('user1@example.com', '유저1', 'UserPassword123!');
      const { accessToken: accessToken2 } = await createUserAndLogin('user2@example.com', '유저2', 'UserPassword123!');
      const { accessToken: adminAccessToken } = await createAdminUserAndLogin();

      const course = await createCourse(adminAccessToken, 'test-course', 'Test Course');
      const enrollment = await createEnrollment(userId1, course.id);

      // when / then
      await request(app.getHttpServer())
        .get(`/enrollments/${enrollment.id}/course`)
        .set('Authorization', `Bearer ${accessToken2}`) // 다른 사용자의 토큰
        .expect(HttpStatus.FORBIDDEN);
    });
  });

  describe('POST /enrollments/:enrollmentId/progress', () => {
    it('수강 진행률을 업데이트한다', async () => {
      // given
      const { userId, accessToken } = await createUserAndLogin('user@example.com', '일반유저', 'UserPassword123!');
      const { accessToken: adminAccessToken } = await createAdminUserAndLogin();

      const course = await createCourse(adminAccessToken, 'test-course', 'Test Course');
      const section = await createSection(adminAccessToken, course.id, 'Section 1', 1);
      const lecture = await createLecture(adminAccessToken, course.id, section.id, 'Lecture 1', 1);
      const enrollment = await createEnrollment(userId, course.id);

      // when
      const response = await request(app.getHttpServer())
        .post(`/enrollments/${enrollment.id}/progress`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          lectureId: lecture.id,
          watchTime: 120,
          isCompleted: false,
        })
        .expect(HttpStatus.OK);

      // then
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.lectureProgress).toMatchObject({
        lectureId: lecture.id,
        watchTime: 120,
        isCompleted: false,
      });
      expect(response.body.data.enrollment).toHaveProperty('progress');
    });

    it('강의를 완료하면 전체 진행률이 업데이트된다', async () => {
      // given
      const { userId, accessToken } = await createUserAndLogin('user@example.com', '일반유저', 'UserPassword123!');
      const { accessToken: adminAccessToken } = await createAdminUserAndLogin();

      const course = await createCourse(adminAccessToken, 'test-course', 'Test Course');
      const section = await createSection(adminAccessToken, course.id, 'Section 1', 1);

      // 2개의 강의 생성
      const lecture1 = await createLecture(adminAccessToken, course.id, section.id, 'Lecture 1', 1);
      const lecture2 = await createLecture(adminAccessToken, course.id, section.id, 'Lecture 2', 2);
      const enrollment = await createEnrollment(userId, course.id);

      // when - 첫 번째 강의 완료
      await request(app.getHttpServer())
        .post(`/enrollments/${enrollment.id}/progress`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          lectureId: lecture1.id,
          watchTime: 600,
          isCompleted: true,
        })
        .expect(HttpStatus.OK);

      // 진행률 확인 (50%)
      const response1 = await request(app.getHttpServer())
        .get(`/enrollments/${enrollment.id}/course`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(HttpStatus.OK);

      expect(response1.body.data.enrollment.progress).toBe(50);
      expect(response1.body.data.enrollment.isCompleted).toBe(false);

      // when - 두 번째 강의 완료
      await request(app.getHttpServer())
        .post(`/enrollments/${enrollment.id}/progress`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          lectureId: lecture2.id,
          watchTime: 600,
          isCompleted: true,
        })
        .expect(HttpStatus.OK);

      // 진행률 확인 (100%)
      const response2 = await request(app.getHttpServer())
        .get(`/enrollments/${enrollment.id}/course`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(HttpStatus.OK);

      expect(response2.body.data.enrollment.progress).toBe(100);
      expect(response2.body.data.enrollment.isCompleted).toBe(true);
      expect(response2.body.data.enrollment.completedAt).not.toBeNull();
    });

    it('잘못된 요청 데이터로 진행률 업데이트 시 400 에러를 반환한다', async () => {
      // given
      const { userId, accessToken } = await createUserAndLogin('user@example.com', '일반유저', 'UserPassword123!');
      const { accessToken: adminAccessToken } = await createAdminUserAndLogin();

      const course = await createCourse(adminAccessToken, 'test-course', 'Test Course');
      const enrollment = await createEnrollment(userId, course.id);

      // when / then - lectureId 누락
      await request(app.getHttpServer())
        .post(`/enrollments/${enrollment.id}/progress`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          watchTime: 120,
          isCompleted: false,
        })
        .expect(HttpStatus.BAD_REQUEST);

      // when / then - watchTime이 음수
      await request(app.getHttpServer())
        .post(`/enrollments/${enrollment.id}/progress`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          lectureId: 'some-lecture-id',
          watchTime: -10,
          isCompleted: false,
        })
        .expect(HttpStatus.BAD_REQUEST);
    });
  });
});
