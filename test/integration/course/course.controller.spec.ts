import { TestHelper } from '@test/integration/test-helper';
import request from 'supertest';

import { HttpStatus, INestApplication } from '@nestjs/common';

import { CourseLevel, CourseStatus } from '@prisma/client';

describe('CourseController (Integration)', () => {
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

  // 관리자 사용자 생성 및 로그인 헬퍼 함수
  const createAdminUserAndLogin = async () => {
    const prisma = TestHelper.getPrisma();
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const bcrypt = require('bcrypt') as { hash: (password: string, salt: number) => Promise<string> };

    // 관리자 사용자 직접 생성
    const hashedPassword = await bcrypt.hash('AdminPassword123!', 10);
    const admin = await prisma.user.create({
      data: {
        email: 'admin@example.com',
        hashedPassword,
        nickname: '관리자',
        role: 'ADMIN',
      },
    });

    // 관리자로 로그인
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

  describe('POST /courses', () => {
    it('관리자가 유효한 데이터로 코스 생성 시 201 상태코드와 코스 정보를 반환한다', async () => {
      // given
      const { accessToken } = await createAdminUserAndLogin();

      const createCourseRequest = {
        slug: 'nestjs-fundamentals',
        title: 'NestJS 완벽 가이드',
        description: 'NestJS를 처음부터 끝까지 배우는 완벽한 강의입니다.',
      };

      // when
      const response = await request(app.getHttpServer())
        .post('/courses')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(createCourseRequest)
        .expect(HttpStatus.CREATED);

      // then
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toMatchObject({
        slug: createCourseRequest.slug,
        title: createCourseRequest.title,
        description: createCourseRequest.description,
        thumbnailUrl: null,
        price: 0,
        level: CourseLevel.BEGINNER,
        status: CourseStatus.DRAFT,
      });
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('createdAt');
    });

    it('관리자가 모든 옵션을 포함하여 코스 생성 시 201 상태코드와 코스 정보를 반환한다', async () => {
      // given
      const { accessToken } = await createAdminUserAndLogin();

      const createCourseRequest = {
        slug: 'advanced-typescript',
        title: '고급 TypeScript',
        description: 'TypeScript 고급 기능을 배웁니다.',
        thumbnailUrl: 'https://example.com/thumbnail.jpg',
        price: 50000,
        level: CourseLevel.INTERMEDIATE,
        status: CourseStatus.OPEN,
      };

      // when
      const response = await request(app.getHttpServer())
        .post('/courses')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(createCourseRequest)
        .expect(HttpStatus.CREATED);

      // then
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toMatchObject({
        slug: createCourseRequest.slug,
        title: createCourseRequest.title,
        description: createCourseRequest.description,
        thumbnailUrl: createCourseRequest.thumbnailUrl,
        price: createCourseRequest.price,
        level: createCourseRequest.level,
        status: createCourseRequest.status,
      });
    });

    it('중복된 slug로 코스 생성 시 409 상태코드를 반환한다', async () => {
      // given
      const { accessToken } = await createAdminUserAndLogin();

      const createCourseRequest = {
        slug: 'duplicate-slug',
        title: '첫번째 코스',
        description: '첫번째 코스 설명',
      };

      // 첫 번째 코스 생성
      await request(app.getHttpServer())
        .post('/courses')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(createCourseRequest)
        .expect(HttpStatus.CREATED);

      // when & then - 동일한 slug로 두 번째 코스 생성 시도
      const duplicateRequest = {
        ...createCourseRequest,
        title: '두번째 코스',
      };

      await request(app.getHttpServer())
        .post('/courses')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(duplicateRequest)
        .expect(HttpStatus.CONFLICT);
    });

    it('일반 사용자가 코스 생성 시도 시 403 상태코드를 반환한다', async () => {
      // given
      const userAccessToken = await createUserAndLogin();

      const createCourseRequest = {
        slug: 'test-course',
        title: '테스트 코스',
        description: '테스트 코스 설명',
      };

      // when & then
      await request(app.getHttpServer())
        .post('/courses')
        .set('Authorization', `Bearer ${userAccessToken}`)
        .send(createCourseRequest)
        .expect(HttpStatus.FORBIDDEN);
    });

    it('토큰 없이 코스 생성 시도 시 401 상태코드를 반환한다', async () => {
      // given
      const createCourseRequest = {
        slug: 'test-course',
        title: '테스트 코스',
        description: '테스트 코스 설명',
      };

      // when & then
      await request(app.getHttpServer()).post('/courses').send(createCourseRequest).expect(HttpStatus.UNAUTHORIZED);
    });

    it('필수 필드 누락 시 400 상태코드를 반환한다', async () => {
      // given
      const { accessToken } = await createAdminUserAndLogin();

      const invalidRequest = {
        slug: 'test-course',
        // title 누락
        description: '테스트 코스 설명',
      };

      // when & then
      await request(app.getHttpServer())
        .post('/courses')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(invalidRequest)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('유효하지 않은 level 값 입력 시 400 상태코드를 반환한다', async () => {
      // given
      const { accessToken } = await createAdminUserAndLogin();

      const invalidRequest = {
        slug: 'test-course',
        title: '테스트 코스',
        description: '테스트 코스 설명',
        level: 'INVALID_LEVEL',
      };

      // when & then
      await request(app.getHttpServer())
        .post('/courses')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(invalidRequest)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('유효하지 않은 status 값 입력 시 400 상태코드를 반환한다', async () => {
      // given
      const { accessToken } = await createAdminUserAndLogin();

      const invalidRequest = {
        slug: 'test-course',
        title: '테스트 코스',
        description: '테스트 코스 설명',
        status: 'INVALID_STATUS',
      };

      // when & then
      await request(app.getHttpServer())
        .post('/courses')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(invalidRequest)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('음수 가격 입력 시 400 상태코드를 반환한다', async () => {
      // given
      const { accessToken } = await createAdminUserAndLogin();

      const invalidRequest = {
        slug: 'test-course',
        title: '테스트 코스',
        description: '테스트 코스 설명',
        price: -1000,
      };

      // when & then
      await request(app.getHttpServer())
        .post('/courses')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(invalidRequest)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('관리자가 생성한 코스의 instructorId는 관리자의 ID와 일치한다', async () => {
      // given
      const { adminId, accessToken } = await createAdminUserAndLogin();

      const createCourseRequest = {
        slug: 'test-course',
        title: '테스트 코스',
        description: '테스트 코스 설명',
      };

      // when
      await request(app.getHttpServer())
        .post('/courses')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(createCourseRequest)
        .expect(HttpStatus.CREATED);

      // then - 데이터베이스에서 코스 확인
      const prisma = TestHelper.getPrisma();
      const course = await prisma.course.findFirst({
        where: { slug: createCourseRequest.slug },
      });

      expect(course).not.toBeNull();
      expect(course!.instructorId).toBe(adminId);
    });
  });

  describe('PATCH /courses/:id', () => {
    it('관리자가 유효한 데이터로 코스 수정 시 200 상태코드와 수정된 코스 정보를 반환한다', async () => {
      // given
      const { accessToken } = await createAdminUserAndLogin();

      // 코스 생성
      const createResponse = await request(app.getHttpServer())
        .post('/courses')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          slug: 'original-course',
          title: '원본 코스',
          description: '원본 설명',
        })
        .expect(HttpStatus.CREATED);

      const courseId = createResponse.body.data.id;

      const updateRequest = {
        title: '수정된 코스',
        description: '수정된 설명',
        price: 30000,
        level: CourseLevel.INTERMEDIATE,
      };

      // when
      const response = await request(app.getHttpServer())
        .patch(`/courses/${courseId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateRequest)
        .expect(HttpStatus.OK);

      // then
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toMatchObject({
        id: courseId,
        slug: 'original-course', // slug는 변경하지 않음
        title: updateRequest.title,
        description: updateRequest.description,
        price: updateRequest.price,
        level: updateRequest.level,
      });
    });

    it('관리자가 slug를 포함하여 코스 수정 시 slug도 변경된다', async () => {
      // given
      const { accessToken } = await createAdminUserAndLogin();

      // 코스 생성
      const createResponse = await request(app.getHttpServer())
        .post('/courses')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          slug: 'original-slug',
          title: '원본 코스',
          description: '원본 설명',
        })
        .expect(HttpStatus.CREATED);

      const courseId = createResponse.body.data.id;

      const updateRequest = {
        slug: 'updated-slug',
        title: '수정된 코스',
      };

      // when
      const response = await request(app.getHttpServer())
        .patch(`/courses/${courseId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateRequest)
        .expect(HttpStatus.OK);

      // then
      expect(response.body.data.slug).toBe('updated-slug');
      expect(response.body.data.title).toBe('수정된 코스');
    });

    it('존재하지 않는 코스 ID로 수정 시도 시 404 상태코드를 반환한다', async () => {
      // given
      const { accessToken } = await createAdminUserAndLogin();
      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      const updateRequest = {
        title: '수정된 코스',
      };

      // when & then
      await request(app.getHttpServer())
        .patch(`/courses/${nonExistentId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateRequest)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('중복된 slug로 수정 시도 시 409 상태코드를 반환한다', async () => {
      // given
      const { accessToken } = await createAdminUserAndLogin();

      // 첫 번째 코스 생성
      await request(app.getHttpServer())
        .post('/courses')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          slug: 'existing-course',
          title: '기존 코스',
          description: '기존 설명',
        })
        .expect(HttpStatus.CREATED);

      // 두 번째 코스 생성
      const createResponse = await request(app.getHttpServer())
        .post('/courses')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          slug: 'course-to-update',
          title: '수정할 코스',
          description: '수정할 설명',
        })
        .expect(HttpStatus.CREATED);

      const courseId = createResponse.body.data.id;

      // when & then - 이미 존재하는 slug로 수정 시도
      await request(app.getHttpServer())
        .patch(`/courses/${courseId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          slug: 'existing-course',
        })
        .expect(HttpStatus.CONFLICT);
    });

    it('일반 사용자가 코스 수정 시도 시 403 상태코드를 반환한다', async () => {
      // given
      const { accessToken: adminToken } = await createAdminUserAndLogin();

      // 관리자로 코스 생성
      const createResponse = await request(app.getHttpServer())
        .post('/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          slug: 'test-course',
          title: '테스트 코스',
          description: '테스트 설명',
        })
        .expect(HttpStatus.CREATED);

      const courseId = createResponse.body.data.id;

      // 일반 사용자로 로그인
      const userToken = await createUserAndLogin();

      // when & then
      await request(app.getHttpServer())
        .patch(`/courses/${courseId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: '수정 시도',
        })
        .expect(HttpStatus.FORBIDDEN);
    });

    it('토큰 없이 코스 수정 시도 시 401 상태코드를 반환한다', async () => {
      // given
      const { accessToken } = await createAdminUserAndLogin();

      // 코스 생성
      const createResponse = await request(app.getHttpServer())
        .post('/courses')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          slug: 'test-course',
          title: '테스트 코스',
          description: '테스트 설명',
        })
        .expect(HttpStatus.CREATED);

      const courseId = createResponse.body.data.id;

      // when & then
      await request(app.getHttpServer())
        .patch(`/courses/${courseId}`)
        .send({
          title: '수정 시도',
        })
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('유효하지 않은 level 값으로 수정 시도 시 400 상태코드를 반환한다', async () => {
      // given
      const { accessToken } = await createAdminUserAndLogin();

      // 코스 생성
      const createResponse = await request(app.getHttpServer())
        .post('/courses')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          slug: 'test-course',
          title: '테스트 코스',
          description: '테스트 설명',
        })
        .expect(HttpStatus.CREATED);

      const courseId = createResponse.body.data.id;

      // when & then
      await request(app.getHttpServer())
        .patch(`/courses/${courseId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          level: 'INVALID_LEVEL',
        })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('음수 가격으로 수정 시도 시 400 상태코드를 반환한다', async () => {
      // given
      const { accessToken } = await createAdminUserAndLogin();

      // 코스 생성
      const createResponse = await request(app.getHttpServer())
        .post('/courses')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          slug: 'test-course',
          title: '테스트 코스',
          description: '테스트 설명',
        })
        .expect(HttpStatus.CREATED);

      const courseId = createResponse.body.data.id;

      // when & then
      await request(app.getHttpServer())
        .patch(`/courses/${courseId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          price: -5000,
        })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('부분 수정(일부 필드만 전송)이 정상 동작한다', async () => {
      // given
      const { accessToken } = await createAdminUserAndLogin();

      // 코스 생성
      const createResponse = await request(app.getHttpServer())
        .post('/courses')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          slug: 'original-course',
          title: '원본 코스',
          description: '원본 설명',
          price: 10000,
          level: CourseLevel.BEGINNER,
        })
        .expect(HttpStatus.CREATED);

      const courseId = createResponse.body.data.id;
      const originalData = createResponse.body.data;

      // when - 제목만 수정
      const response = await request(app.getHttpServer())
        .patch(`/courses/${courseId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: '수정된 제목만',
        })
        .expect(HttpStatus.OK);

      // then - 제목만 변경되고 나머지는 유지
      expect(response.body.data).toMatchObject({
        id: courseId,
        slug: originalData.slug,
        title: '수정된 제목만',
        description: originalData.description,
        price: originalData.price,
        level: originalData.level,
      });
    });

    it('thumbnailUrl을 null로 수정할 수 있다', async () => {
      // given
      const { accessToken } = await createAdminUserAndLogin();

      // 코스 생성 (썸네일 포함)
      const createResponse = await request(app.getHttpServer())
        .post('/courses')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          slug: 'test-course',
          title: '테스트 코스',
          description: '테스트 설명',
          thumbnailUrl: 'https://example.com/thumbnail.jpg',
        })
        .expect(HttpStatus.CREATED);

      const courseId = createResponse.body.data.id;

      // when - thumbnailUrl을 명시적으로 null로 설정
      const response = await request(app.getHttpServer())
        .patch(`/courses/${courseId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          thumbnailUrl: null,
        })
        .expect(HttpStatus.OK);

      // then
      expect(response.body.data.thumbnailUrl).toBeNull();
    });
  });
});
