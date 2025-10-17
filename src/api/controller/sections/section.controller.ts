import { Body, Controller, Delete, HttpCode, HttpStatus, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { AdminGuard } from '@/api/controller/auth/admin.guard';
import { createSuccessResponse, type SuccessResponse } from '@/api/support/response';

import { NewSection } from '@/domain/sections/new-section';
import { SectionService } from '@/domain/sections/section.service';
import { UpdateSection } from '@/domain/sections/update-section';

import { CreateSectionRequest, UpdateSectionRequest } from './section.request';
import { SectionResponse } from './section.response';

@ApiTags('sections')
@Controller('courses/:courseId/sections')
export class SectionController {
  constructor(private readonly sectionService: SectionService) {}

  @Post()
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '섹션 생성 (관리자 전용)' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: '섹션 생성 성공',
    type: SectionResponse,
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
    status: HttpStatus.BAD_REQUEST,
    description: '잘못된 요청 데이터',
  })
  async createSection(
    @Param('courseId') courseId: string,
    @Body() request: CreateSectionRequest,
  ): Promise<SuccessResponse<SectionResponse>> {
    const newSection = new NewSection(request.title, request.order, courseId);

    const section = await this.sectionService.createSection(newSection);

    const response = new SectionResponse(
      section.id,
      section.title,
      section.order,
      section.courseId,
      section.createdAt,
      section.updatedAt,
    );

    return createSuccessResponse(response);
  }

  @Patch(':id')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '섹션 수정 (관리자 전용)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '섹션 수정 성공',
    type: SectionResponse,
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
    description: '섹션을 찾을 수 없습니다',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: '잘못된 요청 데이터',
  })
  async updateSection(
    @Param('id') id: string,
    @Body() request: UpdateSectionRequest,
  ): Promise<SuccessResponse<SectionResponse>> {
    const updateSection = new UpdateSection(id, {
      title: request.title,
      order: request.order,
    });

    const section = await this.sectionService.updateSection(updateSection);

    const response = new SectionResponse(
      section.id,
      section.title,
      section.order,
      section.courseId,
      section.createdAt,
      section.updatedAt,
    );

    return createSuccessResponse(response);
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '섹션 삭제 (관리자 전용)' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: '섹션 삭제 성공',
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
    description: '섹션을 찾을 수 없습니다',
  })
  async deleteSection(@Param('id') id: string): Promise<void> {
    await this.sectionService.deleteSection(id);
  }
}
