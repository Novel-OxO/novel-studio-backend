import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { AccessTokenGuard } from '@/api/controller/auth/access-token.guard';
import { CurrentUser, type CurrentUserPayload } from '@/api/controller/auth/current-user.decorator';
import { createSuccessResponse, type SuccessResponse } from '@/api/support/response';

import { CourseService } from '@/domain/courses/course.service';
import { EnrollmentService } from '@/domain/enrollments/enrollment.service';
import { UpdateLectureProgress } from '@/domain/enrollments/update-lecture-progress';

import { UpdateProgressRequest } from './enrollment.request';
import {
  EnrolledCourseDetailResponse,
  EnrolledLectureResponse,
  EnrolledSectionResponse,
  EnrollmentWithCourseResponse,
  UpdateProgressResponse,
} from './enrollment.response';

@ApiTags('enrollments')
@ApiBearerAuth()
@UseGuards(AccessTokenGuard)
@Controller('enrollments')
export class EnrollmentController {
  constructor(
    private readonly enrollmentService: EnrollmentService,
    private readonly courseService: CourseService,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '수강 중인 강의 목록 조회 (진행률 포함)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '수강 중인 강의 목록 조회 성공',
    type: [EnrollmentWithCourseResponse],
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: '인증 실패',
  })
  async getEnrollments(
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<SuccessResponse<EnrollmentWithCourseResponse[]>> {
    const enrollments = await this.enrollmentService.getEnrollmentsByUserId(user.userId);

    const responses = enrollments.map(({ enrollment, course }) => new EnrollmentWithCourseResponse(enrollment, course));

    return createSuccessResponse(responses);
  }

  @Get(':enrollmentId/course')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '특정 수강 정보의 강의 상세 조회 (비디오 URL 및 진행률 포함)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '강의 상세 조회 성공',
    type: EnrolledCourseDetailResponse,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: '수강 정보를 찾을 수 없음',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: '해당 수강 정보에 접근할 권한이 없음',
  })
  async getEnrolledCourseDetail(
    @Param('enrollmentId') enrollmentId: string,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<SuccessResponse<EnrolledCourseDetailResponse>> {
    // 수강 정보 조회 (권한 체크 포함)
    const enrollment = await this.enrollmentService.getEnrollmentById(enrollmentId, user.userId);

    // 강의 상세 정보 조회 (섹션 및 강의 포함)
    const course = await this.courseService.getCourseById(enrollment.courseId, {
      includeSections: true,
      includeLectures: true,
    });

    // 강의별 진행률 조회
    const lectureProgresses = await this.enrollmentService.getLectureProgressByEnrollmentId(enrollmentId, user.userId);

    // 진행률을 lectureId를 키로 하는 Map으로 변환
    const progressMap = new Map(lectureProgresses.map((progress) => [progress.lectureId, progress]));

    // Section별로 Lecture 그룹화 및 진행률 연결
    const sections = course.sections || [];
    const lectures = course.lectures || [];

    const enrolledSections = sections
      .map((section) => {
        const sectionLectures = lectures
          .filter((lecture) => lecture.sectionId === section.id)
          .sort((a, b) => a.order - b.order)
          .map((lecture) => {
            const progress = progressMap.get(lecture.id) || null;
            return new EnrolledLectureResponse(lecture, progress);
          });

        return new EnrolledSectionResponse(section, sectionLectures);
      })
      .sort((a, b) => a.order - b.order);

    const response = new EnrolledCourseDetailResponse(course, enrollment, enrolledSections);

    return createSuccessResponse(response);
  }

  @Post(':enrollmentId/progress')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '수강 진행률 업데이트' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '진행률 업데이트 성공',
    type: UpdateProgressResponse,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: '수강 정보를 찾을 수 없음',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: '해당 수강 정보에 접근할 권한이 없음',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: '잘못된 요청 데이터',
  })
  async updateProgress(
    @Param('enrollmentId') enrollmentId: string,
    @Body() request: UpdateProgressRequest,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<SuccessResponse<UpdateProgressResponse>> {
    const update = new UpdateLectureProgress(request.lectureId, request.watchTime, request.isCompleted);

    const result = await this.enrollmentService.updateProgress(enrollmentId, user.userId, update);

    const response = new UpdateProgressResponse(result.lectureProgress, result.enrollment);

    return createSuccessResponse(response);
  }
}
