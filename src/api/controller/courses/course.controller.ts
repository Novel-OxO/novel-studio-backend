import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { AdminGuard } from '@/api/controller/auth/admin.guard';
import { CurrentUser, type CurrentUserPayload } from '@/api/controller/auth/current-user.decorator';
import { LectureResponse } from '@/api/controller/lectures/lecture.response';
import { SectionResponse } from '@/api/controller/sections/section.response';
import {
  createPaginatedResponse,
  createSuccessResponse,
  type PaginatedResponse,
  type SuccessResponse,
} from '@/api/support/response';

import { CourseFilter } from '@/domain/courses/course.repository';
import { CourseService } from '@/domain/courses/course.service';
import { NewCourse } from '@/domain/courses/new-course';
import { UpdateCourse } from '@/domain/courses/update-course';

import { CreateCourseRequest, GetCourseByIdRequest, GetCoursesRequest, UpdateCourseRequest } from './course.request';
import { CourseResponse } from './course.response';

@ApiTags('courses')
@Controller('courses')
export class CourseController {
  constructor(private readonly courseService: CourseService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '코스 목록 조회' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '코스 목록 조회 성공',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: '잘못된 요청 파라미터',
  })
  async getCourses(@Query() query: GetCoursesRequest): Promise<PaginatedResponse<CourseResponse>> {
    const filter: CourseFilter = {
      status: query.status,
      level: query.level,
    };

    const { courses, totalCount } = await this.courseService.getCourses(query.page!, query.pageSize!, filter);

    const courseResponses = courses.map(
      (course) =>
        new CourseResponse(
          course.id,
          course.slug,
          course.title,
          course.description,
          course.thumbnailUrl,
          course.price,
          course.level,
          course.status,
          course.createdAt,
        ),
    );

    return createPaginatedResponse(courseResponses, totalCount, query.page!, query.pageSize!);
  }

  /**
   * 코스 상세 조회
   *
   * includeSections, includeLectures 쿼리 파라미터를 통해
   * 섹션과 강의를 포함하여 조회할 수 있습니다.
   * 예: GET /courses/:id?includeSections=true&includeLectures=true
   */
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '코스 상세 조회' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '코스 상세 조회 성공',
    type: CourseResponse,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: '코스를 찾을 수 없습니다',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: '잘못된 요청 파라미터',
  })
  async getCourseById(
    @Param('id') id: string,
    @Query() query: GetCourseByIdRequest,
  ): Promise<SuccessResponse<CourseResponse>> {
    const course = await this.courseService.getCourseById(id, {
      includeSections: query.includeSections,
      includeLectures: query.includeLectures,
    });

    const sections = course.sections?.map(
      (section) =>
        new SectionResponse(
          section.id,
          section.title,
          section.order,
          section.courseId,
          section.createdAt,
          section.updatedAt,
        ),
    );

    const lectures = course.lectures?.map(
      (lecture) =>
        new LectureResponse(
          lecture.id,
          lecture.title,
          lecture.description,
          lecture.order,
          lecture.duration,
          lecture.isPreview,
          lecture.sectionId,
          lecture.courseId,
          lecture.videoStorageInfo,
          lecture.createdAt,
          lecture.updatedAt,
        ),
    );

    const response = new CourseResponse(
      course.id,
      course.slug,
      course.title,
      course.description,
      course.thumbnailUrl,
      course.price,
      course.level,
      course.status,
      course.createdAt,
      sections,
      lectures,
    );

    return createSuccessResponse(response);
  }

  @Post()
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '코스 생성 (관리자 전용)' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: '코스 생성 성공',
    type: CourseResponse,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: '인증되지 않은 사용자',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: '관리자 권한이 필요합니다',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: '이미 사용 중인 slug',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: '잘못된 요청 데이터',
  })
  async createCourse(
    @CurrentUser() currentUser: CurrentUserPayload,
    @Body() request: CreateCourseRequest,
  ): Promise<SuccessResponse<CourseResponse>> {
    const newCourse = new NewCourse(request.slug, request.title, request.description, currentUser.userId, {
      thumbnailUrl: request.thumbnailUrl,
      price: request.price,
      level: request.level,
      status: request.status,
    });

    const course = await this.courseService.createCourse(newCourse);

    const response = new CourseResponse(
      course.id,
      course.slug,
      course.title,
      course.description,
      course.thumbnailUrl,
      course.price,
      course.level,
      course.status,
      course.createdAt,
    );

    return createSuccessResponse(response);
  }

  @Patch(':id')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '코스 수정 (관리자 전용)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '코스 수정 성공',
    type: CourseResponse,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: '인증되지 않은 사용자',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: '관리자 권한이 필요합니다',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: '코스를 찾을 수 없습니다',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: '이미 사용 중인 slug',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: '잘못된 요청 데이터',
  })
  async updateCourse(
    @Param('id') id: string,
    @Body() request: UpdateCourseRequest,
  ): Promise<SuccessResponse<CourseResponse>> {
    const updateCourse = new UpdateCourse(id, {
      slug: request.slug,
      title: request.title,
      description: request.description,
      thumbnailUrl: request.thumbnailUrl,
      price: request.price,
      level: request.level,
      status: request.status,
    });

    const course = await this.courseService.updateCourse(updateCourse);

    const response = new CourseResponse(
      course.id,
      course.slug,
      course.title,
      course.description,
      course.thumbnailUrl,
      course.price,
      course.level,
      course.status,
      course.createdAt,
    );

    return createSuccessResponse(response);
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '코스 삭제 (관리자 전용)' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: '코스 삭제 성공',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: '인증되지 않은 사용자',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: '관리자 권한이 필요합니다',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: '코스를 찾을 수 없습니다',
  })
  async deleteCourse(@Param('id') id: string): Promise<void> {
    await this.courseService.deleteCourse(id);
  }
}
