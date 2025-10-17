import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { AdminGuard } from '@/api/controller/auth/admin.guard';
import { CurrentUser, type CurrentUserPayload } from '@/api/controller/auth/current-user.decorator';
import { createSuccessResponse, type SuccessResponse } from '@/api/support/response';

import { CourseService } from '@/domain/courses/course.service';
import { NewCourse } from '@/domain/courses/new-course';

import { CreateCourseRequest } from './course.request';
import { CourseResponse } from './course.response';

@ApiTags('courses')
@Controller('courses')
export class CourseController {
  constructor(private readonly courseService: CourseService) {}

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
}
