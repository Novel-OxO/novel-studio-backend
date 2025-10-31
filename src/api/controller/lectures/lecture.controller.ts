import { Body, Controller, Delete, HttpCode, HttpStatus, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { AdminGuard } from '@/api/controller/auth/admin.guard';
import { createSuccessResponse, type SuccessResponse } from '@/api/support/response';

import { LectureService } from '@/domain/lectures/lecture.service';
import { NewLecture } from '@/domain/lectures/new-lecture';
import { UpdateLecture } from '@/domain/lectures/update-lecture';

import { CreateLectureRequest, UpdateLectureRequest } from './lecture.request';
import { LectureResponse } from './lecture.response';

@ApiTags('lectures')
@Controller('courses/:courseId/lectures')
export class LectureController {
  constructor(private readonly lectureService: LectureService) {}

  @Post()
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '렉처 생성 (관리자 전용)' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: '렉처 생성 성공',
    type: LectureResponse,
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
    description: '코스 또는 섹션을 찾을 수 없습니다',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: '잘못된 요청 데이터',
  })
  async createLecture(
    @Param('courseId') courseId: string,
    @Body() request: CreateLectureRequest,
  ): Promise<SuccessResponse<LectureResponse>> {
    const newLecture = new NewLecture(request.title, request.order, request.sectionId, courseId, {
      description: request.description,
      duration: request.duration,
      videoUrl: request.videoUrl,
      isPreview: request.isPreview,
    });

    const lecture = await this.lectureService.createLecture(newLecture);

    const response = new LectureResponse(
      lecture.id,
      lecture.title,
      lecture.description,
      lecture.order,
      lecture.duration,
      lecture.videoUrl,
      lecture.isPreview,
      lecture.sectionId,
      lecture.courseId,
      lecture.createdAt,
      lecture.updatedAt,
    );

    return createSuccessResponse(response);
  }

  @Patch(':id')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '렉처 수정 (관리자 전용)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '렉처 수정 성공',
    type: LectureResponse,
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
    description: '렉처를 찾을 수 없습니다',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: '잘못된 요청 데이터',
  })
  async updateLecture(
    @Param('id') id: string,
    @Body() request: UpdateLectureRequest,
  ): Promise<SuccessResponse<LectureResponse>> {
    const updateLecture = new UpdateLecture(id, {
      title: request.title,
      description: request.description,
      order: request.order,
      duration: request.duration,
      videoUrl: request.videoUrl,
      isPreview: request.isPreview,
    });

    const lecture = await this.lectureService.updateLecture(updateLecture);

    const response = new LectureResponse(
      lecture.id,
      lecture.title,
      lecture.description,
      lecture.order,
      lecture.duration,
      lecture.videoUrl,
      lecture.isPreview,
      lecture.sectionId,
      lecture.courseId,
      lecture.createdAt,
      lecture.updatedAt,
    );

    return createSuccessResponse(response);
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '렉처 삭제 (관리자 전용)' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: '렉처 삭제 성공',
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
    description: '렉처를 찾을 수 없습니다',
  })
  async deleteLecture(@Param('id') id: string): Promise<void> {
    await this.lectureService.deleteLecture(id);
  }
}
