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

  describe('GET /courses', () => {
    it('코스 목록을 페이지네이션과 함께 반환한다', async () => {
      // given
      const { accessToken } = await createAdminUserAndLogin();

      // 테스트용 코스 3개 생성
      for (let i = 1; i <= 3; i++) {
        await request(app.getHttpServer())
          .post('/courses')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            slug: `course-${i}`,
            title: `코스 ${i}`,
            description: `코스 ${i} 설명`,
          })
          .expect(HttpStatus.CREATED);
      }

      // when
      const response = await request(app.getHttpServer()).get('/courses').expect(HttpStatus.OK);

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

    it('페이지네이션이 정상 동작한다', async () => {
      // given
      const { accessToken } = await createAdminUserAndLogin();

      // 테스트용 코스 5개 생성
      for (let i = 1; i <= 5; i++) {
        await request(app.getHttpServer())
          .post('/courses')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            slug: `course-${i}`,
            title: `코스 ${i}`,
            description: `코스 ${i} 설명`,
          })
          .expect(HttpStatus.CREATED);
      }

      // when - 페이지 크기 2로 2페이지 요청
      const response = await request(app.getHttpServer()).get('/courses?page=2&pageSize=2').expect(HttpStatus.OK);

      // then
      expect(response.body.data.items).toHaveLength(2);
      expect(response.body.data.pagination).toMatchObject({
        totalCount: 5,
        page: 2,
        pageSize: 2,
        totalPages: 3,
      });
    });

    it('상태(status)로 필터링할 수 있다', async () => {
      // given
      const { accessToken } = await createAdminUserAndLogin();

      // DRAFT 코스 2개 생성
      await request(app.getHttpServer())
        .post('/courses')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          slug: 'draft-course-1',
          title: 'Draft 코스 1',
          description: 'Draft 설명',
          status: CourseStatus.DRAFT,
        })
        .expect(HttpStatus.CREATED);

      await request(app.getHttpServer())
        .post('/courses')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          slug: 'draft-course-2',
          title: 'Draft 코스 2',
          description: 'Draft 설명',
          status: CourseStatus.DRAFT,
        })
        .expect(HttpStatus.CREATED);

      // OPEN 코스 1개 생성
      await request(app.getHttpServer())
        .post('/courses')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          slug: 'open-course',
          title: 'Open 코스',
          description: 'Open 설명',
          status: CourseStatus.OPEN,
        })
        .expect(HttpStatus.CREATED);

      // when - DRAFT 상태만 필터링
      const response = await request(app.getHttpServer())
        .get(`/courses?status=${CourseStatus.DRAFT}`)
        .expect(HttpStatus.OK);

      // then
      expect(response.body.data.items).toHaveLength(2);
      expect(response.body.data.pagination.totalCount).toBe(2);
      response.body.data.items.forEach((item: any) => {
        expect(item.status).toBe(CourseStatus.DRAFT);
      });
    });

    it('난이도(level)로 필터링할 수 있다', async () => {
      // given
      const { accessToken } = await createAdminUserAndLogin();

      // BEGINNER 코스 생성
      await request(app.getHttpServer())
        .post('/courses')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          slug: 'beginner-course',
          title: 'Beginner 코스',
          description: 'Beginner 설명',
          level: CourseLevel.BEGINNER,
        })
        .expect(HttpStatus.CREATED);

      // INTERMEDIATE 코스 생성
      await request(app.getHttpServer())
        .post('/courses')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          slug: 'intermediate-course',
          title: 'Intermediate 코스',
          description: 'Intermediate 설명',
          level: CourseLevel.INTERMEDIATE,
        })
        .expect(HttpStatus.CREATED);

      // when - INTERMEDIATE 레벨만 필터링
      const response = await request(app.getHttpServer())
        .get(`/courses?level=${CourseLevel.INTERMEDIATE}`)
        .expect(HttpStatus.OK);

      // then
      expect(response.body.data.items).toHaveLength(1);
      expect(response.body.data.items[0].level).toBe(CourseLevel.INTERMEDIATE);
    });

    it('상태와 난이도를 동시에 필터링할 수 있다', async () => {
      // given
      const { accessToken } = await createAdminUserAndLogin();

      // DRAFT + BEGINNER 코스
      await request(app.getHttpServer())
        .post('/courses')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          slug: 'draft-beginner',
          title: 'Draft Beginner 코스',
          description: 'Draft Beginner 설명',
          status: CourseStatus.DRAFT,
          level: CourseLevel.BEGINNER,
        })
        .expect(HttpStatus.CREATED);

      // OPEN + BEGINNER 코스
      await request(app.getHttpServer())
        .post('/courses')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          slug: 'open-beginner',
          title: 'Open Beginner 코스',
          description: 'Open Beginner 설명',
          status: CourseStatus.OPEN,
          level: CourseLevel.BEGINNER,
        })
        .expect(HttpStatus.CREATED);

      // DRAFT + INTERMEDIATE 코스
      await request(app.getHttpServer())
        .post('/courses')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          slug: 'draft-intermediate',
          title: 'Draft Intermediate 코스',
          description: 'Draft Intermediate 설명',
          status: CourseStatus.DRAFT,
          level: CourseLevel.INTERMEDIATE,
        })
        .expect(HttpStatus.CREATED);

      // when - DRAFT 상태 + BEGINNER 레벨 필터링
      const response = await request(app.getHttpServer())
        .get(`/courses?status=${CourseStatus.DRAFT}&level=${CourseLevel.BEGINNER}`)
        .expect(HttpStatus.OK);

      // then
      expect(response.body.data.items).toHaveLength(1);
      expect(response.body.data.items[0].status).toBe(CourseStatus.DRAFT);
      expect(response.body.data.items[0].level).toBe(CourseLevel.BEGINNER);
    });

    it('코스가 없을 때 빈 배열을 반환한다', async () => {
      // when
      const response = await request(app.getHttpServer()).get('/courses').expect(HttpStatus.OK);

      // then
      expect(response.body.data.items).toEqual([]);
      expect(response.body.data.pagination.totalCount).toBe(0);
    });

    it('최신 코스가 먼저 조회된다 (createdAt desc)', async () => {
      // given
      const { accessToken } = await createAdminUserAndLogin();

      // 3개의 코스를 순차적으로 생성
      const course1 = await request(app.getHttpServer())
        .post('/courses')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          slug: 'first-course',
          title: '첫 번째 코스',
          description: '첫 번째 설명',
        })
        .expect(HttpStatus.CREATED);

      const course2 = await request(app.getHttpServer())
        .post('/courses')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          slug: 'second-course',
          title: '두 번째 코스',
          description: '두 번째 설명',
        })
        .expect(HttpStatus.CREATED);

      const course3 = await request(app.getHttpServer())
        .post('/courses')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          slug: 'third-course',
          title: '세 번째 코스',
          description: '세 번째 설명',
        })
        .expect(HttpStatus.CREATED);

      // when
      const response = await request(app.getHttpServer()).get('/courses').expect(HttpStatus.OK);

      // then - 최신 순서 (3 -> 2 -> 1)
      expect(response.body.data.items[0].id).toBe(course3.body.data.id);
      expect(response.body.data.items[1].id).toBe(course2.body.data.id);
      expect(response.body.data.items[2].id).toBe(course1.body.data.id);
    });

    it('잘못된 페이지 번호(0 이하)로 요청 시 400 상태코드를 반환한다', async () => {
      // when & then
      await request(app.getHttpServer()).get('/courses?page=0').expect(HttpStatus.BAD_REQUEST);
    });

    it('잘못된 페이지 크기(0 이하)로 요청 시 400 상태코드를 반환한다', async () => {
      // when & then
      await request(app.getHttpServer()).get('/courses?pageSize=0').expect(HttpStatus.BAD_REQUEST);
    });

    it('유효하지 않은 status 값으로 요청 시 400 상태코드를 반환한다', async () => {
      // when & then
      await request(app.getHttpServer()).get('/courses?status=INVALID_STATUS').expect(HttpStatus.BAD_REQUEST);
    });

    it('유효하지 않은 level 값으로 요청 시 400 상태코드를 반환한다', async () => {
      // when & then
      await request(app.getHttpServer()).get('/courses?level=INVALID_LEVEL').expect(HttpStatus.BAD_REQUEST);
    });
  });

  describe('GET /courses/:id', () => {
    it('유효한 ID로 코스 상세 조회 시 200 상태코드와 코스 정보를 반환한다', async () => {
      // given
      const { accessToken } = await createAdminUserAndLogin();

      const createResponse = await request(app.getHttpServer())
        .post('/courses')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          slug: 'test-course',
          title: '테스트 코스',
          description: '테스트 설명',
          thumbnailUrl: 'https://example.com/thumbnail.jpg',
          price: 50000,
          level: CourseLevel.INTERMEDIATE,
          status: CourseStatus.OPEN,
        })
        .expect(HttpStatus.CREATED);

      const courseId = createResponse.body.data.id;

      // when
      const response = await request(app.getHttpServer()).get(`/courses/${courseId}`).expect(HttpStatus.OK);

      // then
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toMatchObject({
        id: courseId,
        slug: 'test-course',
        title: '테스트 코스',
        description: '테스트 설명',
        thumbnailUrl: 'https://example.com/thumbnail.jpg',
        price: 50000,
        level: CourseLevel.INTERMEDIATE,
        status: CourseStatus.OPEN,
      });
      expect(response.body.data).toHaveProperty('createdAt');
    });

    it('존재하지 않는 ID로 조회 시 404 상태코드를 반환한다', async () => {
      // given
      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      // when & then
      await request(app.getHttpServer()).get(`/courses/${nonExistentId}`).expect(HttpStatus.NOT_FOUND);
    });

    it('삭제된 코스는 조회되지 않는다', async () => {
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

      // 데이터베이스에서 직접 삭제 처리 (소프트 삭제)
      const prisma = TestHelper.getPrisma();
      await prisma.course.update({
        where: { id: courseId },
        data: { deletedAt: new Date() },
      });

      // when & then - 삭제된 코스 조회 시도
      await request(app.getHttpServer()).get(`/courses/${courseId}`).expect(HttpStatus.NOT_FOUND);
    });

    it('코스 기본 정보가 모두 포함되어 반환된다', async () => {
      // given
      const { accessToken } = await createAdminUserAndLogin();

      const createResponse = await request(app.getHttpServer())
        .post('/courses')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          slug: 'complete-course',
          title: '완전한 코스',
          description: '완전한 설명',
          thumbnailUrl: 'https://example.com/thumb.jpg',
          price: 99000,
          level: CourseLevel.BASIC,
          status: CourseStatus.OPEN,
        })
        .expect(HttpStatus.CREATED);

      const courseId = createResponse.body.data.id;

      // when
      const response = await request(app.getHttpServer()).get(`/courses/${courseId}`).expect(HttpStatus.OK);

      // then - 모든 필드가 존재하는지 확인
      const courseData = response.body.data;
      expect(courseData).toHaveProperty('id');
      expect(courseData).toHaveProperty('slug');
      expect(courseData).toHaveProperty('title');
      expect(courseData).toHaveProperty('description');
      expect(courseData).toHaveProperty('thumbnailUrl');
      expect(courseData).toHaveProperty('price');
      expect(courseData).toHaveProperty('level');
      expect(courseData).toHaveProperty('status');
      expect(courseData).toHaveProperty('createdAt');
    });

    it('thumbnailUrl이 null인 코스도 정상 조회된다', async () => {
      // given
      const { accessToken } = await createAdminUserAndLogin();

      const createResponse = await request(app.getHttpServer())
        .post('/courses')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          slug: 'no-thumbnail-course',
          title: '썸네일 없는 코스',
          description: '썸네일 없는 설명',
        })
        .expect(HttpStatus.CREATED);

      const courseId = createResponse.body.data.id;

      // when
      const response = await request(app.getHttpServer()).get(`/courses/${courseId}`).expect(HttpStatus.OK);

      // then
      expect(response.body.data.thumbnailUrl).toBeNull();
    });

    it('DRAFT 상태의 코스도 상세 조회가 가능하다', async () => {
      // given
      const { accessToken } = await createAdminUserAndLogin();

      const createResponse = await request(app.getHttpServer())
        .post('/courses')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          slug: 'draft-course',
          title: 'Draft 코스',
          description: 'Draft 설명',
          status: CourseStatus.DRAFT,
        })
        .expect(HttpStatus.CREATED);

      const courseId = createResponse.body.data.id;

      // when
      const response = await request(app.getHttpServer()).get(`/courses/${courseId}`).expect(HttpStatus.OK);

      // then
      expect(response.body.data.status).toBe(CourseStatus.DRAFT);
    });

    it('includeSections=true일 때 섹션이 포함되어 반환된다', async () => {
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

      // 섹션 2개 생성
      const prisma = TestHelper.getPrisma();
      await prisma.section.createMany({
        data: [
          {
            title: '섹션 1',
            order: 1,
            courseId: courseId,
          },
          {
            title: '섹션 2',
            order: 2,
            courseId: courseId,
          },
        ],
      });

      // when
      const response = await request(app.getHttpServer())
        .get(`/courses/${courseId}?includeSections=true`)
        .expect(HttpStatus.OK);

      // then
      expect(response.body.data).toHaveProperty('sections');
      expect(response.body.data.sections).toHaveLength(2);
      expect(response.body.data.sections[0]).toMatchObject({
        title: '섹션 1',
        order: 1,
        courseId: courseId,
      });
      expect(response.body.data.sections[1]).toMatchObject({
        title: '섹션 2',
        order: 2,
        courseId: courseId,
      });
    });

    it('includeLectures=true일 때 강의가 포함되어 반환된다', async () => {
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

      // 섹션 생성
      const prisma = TestHelper.getPrisma();
      const section = await prisma.section.create({
        data: {
          title: '섹션 1',
          order: 1,
          courseId: courseId,
        },
      });

      // 강의 2개 생성
      await prisma.lecture.createMany({
        data: [
          {
            title: '강의 1',
            order: 1,
            sectionId: section.id,
            courseId: courseId,
          },
          {
            title: '강의 2',
            order: 2,
            sectionId: section.id,
            courseId: courseId,
            description: '강의 2 설명',
            duration: 600,
            isPreview: true,
          },
        ],
      });

      // when
      const response = await request(app.getHttpServer())
        .get(`/courses/${courseId}?includeLectures=true`)
        .expect(HttpStatus.OK);

      // then
      expect(response.body.data).toHaveProperty('lectures');
      expect(response.body.data.lectures).toHaveLength(2);
      expect(response.body.data.lectures[0]).toMatchObject({
        title: '강의 1',
        order: 1,
        sectionId: section.id,
        courseId: courseId,
      });
      expect(response.body.data.lectures[1]).toMatchObject({
        title: '강의 2',
        order: 2,
        sectionId: section.id,
        courseId: courseId,
        description: '강의 2 설명',
        duration: 600,
        isPreview: true,
      });
    });

    it('includeSections=true&includeLectures=true일 때 섹션과 강의가 모두 포함되어 반환된다', async () => {
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

      // 섹션 생성
      const prisma = TestHelper.getPrisma();
      const section1 = await prisma.section.create({
        data: {
          title: '섹션 1',
          order: 1,
          courseId: courseId,
        },
      });

      const section2 = await prisma.section.create({
        data: {
          title: '섹션 2',
          order: 2,
          courseId: courseId,
        },
      });

      // 강의 생성
      await prisma.lecture.createMany({
        data: [
          {
            title: '강의 1-1',
            order: 1,
            sectionId: section1.id,
            courseId: courseId,
          },
          {
            title: '강의 2-1',
            order: 1,
            sectionId: section2.id,
            courseId: courseId,
          },
        ],
      });

      // when
      const response = await request(app.getHttpServer())
        .get(`/courses/${courseId}?includeSections=true&includeLectures=true`)
        .expect(HttpStatus.OK);

      // then
      expect(response.body.data).toHaveProperty('sections');
      expect(response.body.data).toHaveProperty('lectures');
      expect(response.body.data.sections).toHaveLength(2);
      expect(response.body.data.lectures).toHaveLength(2);
    });

    it('옵션 없이 조회할 때 섹션과 강의가 포함되지 않는다', async () => {
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

      // 섹션과 강의 생성
      const prisma = TestHelper.getPrisma();
      const section = await prisma.section.create({
        data: {
          title: '섹션 1',
          order: 1,
          courseId: courseId,
        },
      });

      await prisma.lecture.create({
        data: {
          title: '강의 1',
          order: 1,
          sectionId: section.id,
          courseId: courseId,
        },
      });

      // when
      const response = await request(app.getHttpServer()).get(`/courses/${courseId}`).expect(HttpStatus.OK);

      // then
      expect(response.body.data).not.toHaveProperty('sections');
      expect(response.body.data).not.toHaveProperty('lectures');
    });

    it('삭제된 섹션과 강의는 포함되지 않는다', async () => {
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

      // 섹션 생성 (1개는 삭제됨, 1개는 정상)
      const prisma = TestHelper.getPrisma();
      await prisma.section.create({
        data: {
          title: '삭제된 섹션',
          order: 1,
          courseId: courseId,
          deletedAt: new Date(),
        },
      });

      const activeSection = await prisma.section.create({
        data: {
          title: '정상 섹션',
          order: 2,
          courseId: courseId,
        },
      });

      // 강의 생성 (1개는 삭제됨, 1개는 정상)
      await prisma.lecture.create({
        data: {
          title: '삭제된 강의',
          order: 1,
          sectionId: activeSection.id,
          courseId: courseId,
          deletedAt: new Date(),
        },
      });

      await prisma.lecture.create({
        data: {
          title: '정상 강의',
          order: 2,
          sectionId: activeSection.id,
          courseId: courseId,
        },
      });

      // when
      const response = await request(app.getHttpServer())
        .get(`/courses/${courseId}?includeSections=true&includeLectures=true`)
        .expect(HttpStatus.OK);

      // then
      expect(response.body.data.sections).toHaveLength(1);
      expect(response.body.data.sections[0].title).toBe('정상 섹션');
      expect(response.body.data.lectures).toHaveLength(1);
      expect(response.body.data.lectures[0].title).toBe('정상 강의');
    });
  });

  describe('DELETE /courses/:id', () => {
    it('관리자가 유효한 ID로 코스 삭제 시 204 상태코드를 반환한다', async () => {
      // given
      const { accessToken } = await createAdminUserAndLogin();

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

      // when
      await request(app.getHttpServer())
        .delete(`/courses/${courseId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(HttpStatus.NO_CONTENT);

      // then - 삭제된 코스는 조회되지 않아야 함
      await request(app.getHttpServer()).get(`/courses/${courseId}`).expect(HttpStatus.NOT_FOUND);
    });

    it('삭제된 코스는 목록 조회에도 포함되지 않는다', async () => {
      // given
      const { accessToken } = await createAdminUserAndLogin();

      // 코스 2개 생성
      const course1 = await request(app.getHttpServer())
        .post('/courses')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          slug: 'course-1',
          title: '코스 1',
          description: '설명 1',
        })
        .expect(HttpStatus.CREATED);

      await request(app.getHttpServer())
        .post('/courses')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          slug: 'course-2',
          title: '코스 2',
          description: '설명 2',
        })
        .expect(HttpStatus.CREATED);

      // when - 첫 번째 코스 삭제
      await request(app.getHttpServer())
        .delete(`/courses/${course1.body.data.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(HttpStatus.NO_CONTENT);

      // then - 목록 조회 시 1개만 나와야 함
      const listResponse = await request(app.getHttpServer()).get('/courses').expect(HttpStatus.OK);

      expect(listResponse.body.data.items).toHaveLength(1);
      expect(listResponse.body.data.pagination.totalCount).toBe(1);
      expect(listResponse.body.data.items[0].slug).toBe('course-2');
    });

    it('존재하지 않는 ID로 삭제 시도 시 404 상태코드를 반환한다', async () => {
      // given
      const { accessToken } = await createAdminUserAndLogin();
      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      // when & then
      await request(app.getHttpServer())
        .delete(`/courses/${nonExistentId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('이미 삭제된 코스를 다시 삭제하려고 하면 404 상태코드를 반환한다', async () => {
      // given
      const { accessToken } = await createAdminUserAndLogin();

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

      // 첫 번째 삭제
      await request(app.getHttpServer())
        .delete(`/courses/${courseId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(HttpStatus.NO_CONTENT);

      // when & then - 두 번째 삭제 시도
      await request(app.getHttpServer())
        .delete(`/courses/${courseId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('일반 사용자가 코스 삭제 시도 시 403 상태코드를 반환한다', async () => {
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
        .delete(`/courses/${courseId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(HttpStatus.FORBIDDEN);
    });

    it('토큰 없이 코스 삭제 시도 시 401 상태코드를 반환한다', async () => {
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
      await request(app.getHttpServer()).delete(`/courses/${courseId}`).expect(HttpStatus.UNAUTHORIZED);
    });

    it('삭제된 코스의 데이터베이스 deletedAt이 설정된다', async () => {
      // given
      const { accessToken } = await createAdminUserAndLogin();

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

      // when
      await request(app.getHttpServer())
        .delete(`/courses/${courseId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(HttpStatus.NO_CONTENT);

      // then - 데이터베이스에서 직접 확인
      const prisma = TestHelper.getPrisma();
      const deletedCourse = await prisma.course.findUnique({
        where: { id: courseId },
      });

      expect(deletedCourse).not.toBeNull();
      expect(deletedCourse!.deletedAt).not.toBeNull();
      expect(deletedCourse!.deletedAt).toBeInstanceOf(Date);
    });
  });

  describe('GET /courses/detail/:slug', () => {
    it('유효한 slug로 코스 조회 시 200 상태코드와 섹션, 강의 정보를 반환한다 (비디오 URL 제외)', async () => {
      // given
      const { accessToken } = await createAdminUserAndLogin();

      // 코스 생성
      const createResponse = await request(app.getHttpServer())
        .post('/courses')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          slug: 'nestjs-fundamentals',
          title: 'NestJS 완벽 가이드',
          description: 'NestJS를 처음부터 끝까지 배우는 완벽한 강의입니다.',
          thumbnailUrl: 'https://example.com/thumbnail.jpg',
          price: 50000,
          level: CourseLevel.INTERMEDIATE,
          status: CourseStatus.OPEN,
        })
        .expect(HttpStatus.CREATED);

      const courseId = createResponse.body.data.id;

      // 섹션 생성
      const prisma = TestHelper.getPrisma();
      const section1 = await prisma.section.create({
        data: {
          title: '섹션 1: 기초',
          order: 1,
          courseId: courseId,
        },
      });

      const section2 = await prisma.section.create({
        data: {
          title: '섹션 2: 심화',
          order: 2,
          courseId: courseId,
        },
      });

      // 강의 생성 (videoUrl 포함)
      await prisma.lecture.createMany({
        data: [
          {
            title: '강의 1-1',
            description: '첫 번째 강의',
            order: 1,
            duration: 600,
            videoUrl: 'https://secret-video-url.com/lecture1-1.mp4',
            isPreview: true,
            sectionId: section1.id,
            courseId: courseId,
          },
          {
            title: '강의 1-2',
            description: '두 번째 강의',
            order: 2,
            duration: 720,
            videoUrl: 'https://secret-video-url.com/lecture1-2.mp4',
            isPreview: false,
            sectionId: section1.id,
            courseId: courseId,
          },
          {
            title: '강의 2-1',
            order: 1,
            duration: 800,
            videoUrl: 'https://secret-video-url.com/lecture2-1.mp4',
            isPreview: false,
            sectionId: section2.id,
            courseId: courseId,
          },
        ],
      });

      // when
      const response = await request(app.getHttpServer())
        .get('/courses/detail/nestjs-fundamentals')
        .expect(HttpStatus.OK);

      // then
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toMatchObject({
        id: courseId,
        slug: 'nestjs-fundamentals',
        title: 'NestJS 완벽 가이드',
        description: 'NestJS를 처음부터 끝까지 배우는 완벽한 강의입니다.',
        thumbnailUrl: 'https://example.com/thumbnail.jpg',
        price: 50000,
        level: CourseLevel.INTERMEDIATE,
        status: CourseStatus.OPEN,
      });

      // 섹션이 포함되어야 함
      expect(response.body.data).toHaveProperty('sections');
      expect(response.body.data.sections).toHaveLength(2);
      expect(response.body.data.sections[0]).toMatchObject({
        title: '섹션 1: 기초',
        order: 1,
      });
      expect(response.body.data.sections[1]).toMatchObject({
        title: '섹션 2: 심화',
        order: 2,
      });

      // 강의가 포함되어야 함
      expect(response.body.data).toHaveProperty('lectures');
      expect(response.body.data.lectures).toHaveLength(3);

      // ⚠️ 중요: videoUrl이 포함되지 않아야 함!
      response.body.data.lectures.forEach((lecture: any) => {
        expect(lecture).not.toHaveProperty('videoUrl');
        expect(lecture).toHaveProperty('id');
        expect(lecture).toHaveProperty('title');
        expect(lecture).toHaveProperty('description');
        expect(lecture).toHaveProperty('order');
        expect(lecture).toHaveProperty('duration');
        expect(lecture).toHaveProperty('isPreview');
        expect(lecture).toHaveProperty('sectionId');
        expect(lecture).toHaveProperty('courseId');
        expect(lecture).toHaveProperty('createdAt');
        expect(lecture).toHaveProperty('updatedAt');
      });
    });

    it('존재하지 않는 slug로 조회 시 404 상태코드를 반환한다', async () => {
      // when & then
      await request(app.getHttpServer()).get('/courses/detail/non-existent-slug').expect(HttpStatus.NOT_FOUND);
    });

    it('삭제된 코스는 slug로 조회되지 않는다', async () => {
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

      // 데이터베이스에서 직접 삭제 처리 (소프트 삭제)
      const prisma = TestHelper.getPrisma();
      await prisma.course.update({
        where: { id: courseId },
        data: { deletedAt: new Date() },
      });

      // when & then - 삭제된 코스 조회 시도
      await request(app.getHttpServer()).get('/courses/detail/test-course').expect(HttpStatus.NOT_FOUND);
    });

    it('강의와 섹션이 없는 코스도 정상 조회된다', async () => {
      // given
      const { accessToken } = await createAdminUserAndLogin();

      // 코스만 생성 (섹션/강의 없음)
      await request(app.getHttpServer())
        .post('/courses')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          slug: 'empty-course',
          title: '빈 코스',
          description: '섹션과 강의가 없는 코스',
        })
        .expect(HttpStatus.CREATED);

      // when
      const response = await request(app.getHttpServer()).get('/courses/detail/empty-course').expect(HttpStatus.OK);

      // then
      expect(response.body.data).toHaveProperty('sections');
      expect(response.body.data.sections).toEqual([]);
      expect(response.body.data).toHaveProperty('lectures');
      expect(response.body.data.lectures).toEqual([]);
    });

    it('삭제된 섹션과 강의는 포함되지 않는다', async () => {
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

      // 섹션 생성 (1개는 삭제됨, 1개는 정상)
      const prisma = TestHelper.getPrisma();
      await prisma.section.create({
        data: {
          title: '삭제된 섹션',
          order: 1,
          courseId: courseId,
          deletedAt: new Date(),
        },
      });

      const activeSection = await prisma.section.create({
        data: {
          title: '정상 섹션',
          order: 2,
          courseId: courseId,
        },
      });

      // 강의 생성 (1개는 삭제됨, 1개는 정상)
      await prisma.lecture.create({
        data: {
          title: '삭제된 강의',
          order: 1,
          videoUrl: 'https://example.com/deleted-video.mp4',
          sectionId: activeSection.id,
          courseId: courseId,
          deletedAt: new Date(),
        },
      });

      await prisma.lecture.create({
        data: {
          title: '정상 강의',
          order: 2,
          videoUrl: 'https://example.com/active-video.mp4',
          sectionId: activeSection.id,
          courseId: courseId,
        },
      });

      // when
      const response = await request(app.getHttpServer()).get('/courses/detail/test-course').expect(HttpStatus.OK);

      // then
      expect(response.body.data.sections).toHaveLength(1);
      expect(response.body.data.sections[0].title).toBe('정상 섹션');
      expect(response.body.data.lectures).toHaveLength(1);
      expect(response.body.data.lectures[0].title).toBe('정상 강의');
      // videoUrl이 노출되지 않아야 함
      expect(response.body.data.lectures[0]).not.toHaveProperty('videoUrl');
    });

    it('섹션과 강의가 order 순서대로 정렬되어 반환된다', async () => {
      // given
      const { accessToken } = await createAdminUserAndLogin();

      // 코스 생성
      const createResponse = await request(app.getHttpServer())
        .post('/courses')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          slug: 'ordered-course',
          title: '순서 테스트 코스',
          description: '순서 확인용',
        })
        .expect(HttpStatus.CREATED);

      const courseId = createResponse.body.data.id;

      // 섹션을 역순으로 생성
      const prisma = TestHelper.getPrisma();
      await prisma.section.create({
        data: { title: '섹션 3', order: 3, courseId },
      });

      const section1 = await prisma.section.create({
        data: { title: '섹션 1', order: 1, courseId },
      });

      await prisma.section.create({
        data: { title: '섹션 2', order: 2, courseId },
      });

      // 강의도 역순으로 생성
      await prisma.lecture.createMany({
        data: [
          {
            title: '강의 3',
            order: 3,
            sectionId: section1.id,
            courseId,
          },
          {
            title: '강의 1',
            order: 1,
            sectionId: section1.id,
            courseId,
          },
          {
            title: '강의 2',
            order: 2,
            sectionId: section1.id,
            courseId,
          },
        ],
      });

      // when
      const response = await request(app.getHttpServer()).get('/courses/detail/ordered-course').expect(HttpStatus.OK);

      // then - 섹션이 order 순서대로 정렬되어야 함
      expect(response.body.data.sections[0].title).toBe('섹션 1');
      expect(response.body.data.sections[1].title).toBe('섹션 2');
      expect(response.body.data.sections[2].title).toBe('섹션 3');

      // 강의도 order 순서대로 정렬되어야 함
      expect(response.body.data.lectures[0].title).toBe('강의 1');
      expect(response.body.data.lectures[1].title).toBe('강의 2');
      expect(response.body.data.lectures[2].title).toBe('강의 3');
    });

    it('DRAFT 상태의 코스도 slug로 조회가 가능하다', async () => {
      // given
      const { accessToken } = await createAdminUserAndLogin();

      await request(app.getHttpServer())
        .post('/courses')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          slug: 'draft-course',
          title: 'Draft 코스',
          description: 'Draft 설명',
          status: CourseStatus.DRAFT,
        })
        .expect(HttpStatus.CREATED);

      // when
      const response = await request(app.getHttpServer()).get('/courses/detail/draft-course').expect(HttpStatus.OK);

      // then
      expect(response.body.data.status).toBe(CourseStatus.DRAFT);
    });
  });
});
