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

import { AccessTokenGuard } from '@/api/controller/auth/access-token.guard';
import { CurrentUser, type CurrentUserPayload } from '@/api/controller/auth/current-user.decorator';
import {
  createPaginatedResponse,
  createSuccessResponse,
  type PaginatedResponse,
  type SuccessResponse,
} from '@/api/support/response';

import { NewAnswer } from '@/domain/questions/new-answer';
import { NewQuestion } from '@/domain/questions/new-question';
import { QuestionService } from '@/domain/questions/question.service';
import { UpdateAnswer } from '@/domain/questions/update-answer';
import { UpdateQuestion } from '@/domain/questions/update-question';

import { AnswerResponse } from './answer.response';
import { CreateAnswerDto } from './dto/create-answer.dto';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateAnswerDto } from './dto/update-answer.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { QuestionResponse } from './question.response';

@ApiTags('questions')
@Controller('questions')
export class QuestionController {
  constructor(private readonly questionService: QuestionService) {}

  @Post('courses/:courseId')
  @UseGuards(AccessTokenGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '질문 작성' })
  @ApiResponse({ status: HttpStatus.CREATED, description: '질문 작성 성공' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음 (수강생만 가능)' })
  async createQuestion(
    @CurrentUser() user: CurrentUserPayload,
    @Param('courseId') courseId: string,
    @Body() dto: CreateQuestionDto,
  ): Promise<SuccessResponse<QuestionResponse>> {
    const newQuestion = new NewQuestion(dto.title, dto.content, user.userId, courseId);
    const question = await this.questionService.createQuestion(newQuestion);
    return createSuccessResponse(QuestionResponse.from(question));
  }

  @Get('courses/:courseId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '강의별 질문 목록 조회' })
  @ApiResponse({ status: HttpStatus.OK, description: '질문 목록 조회 성공' })
  async getQuestions(
    @Param('courseId') courseId: string,
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 10,
  ): Promise<PaginatedResponse<QuestionResponse>> {
    const result = await this.questionService.getQuestionsByCourse(courseId, Number(page), Number(pageSize));
    return createPaginatedResponse(
      result.questions.map((q) => QuestionResponse.from(q)),
      result.totalCount,
      Number(page),
      Number(pageSize),
    );
  }

  @Get(':questionId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '질문 상세 조회' })
  @ApiResponse({ status: HttpStatus.OK, description: '질문 조회 성공' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '질문을 찾을 수 없음' })
  async getQuestion(@Param('questionId') questionId: string): Promise<SuccessResponse<QuestionResponse>> {
    const question = await this.questionService.getQuestionById(questionId);
    return createSuccessResponse(QuestionResponse.from(question));
  }

  @Patch(':questionId')
  @UseGuards(AccessTokenGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '질문 수정' })
  @ApiResponse({ status: HttpStatus.OK, description: '질문 수정 성공' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음 (작성자만 가능)' })
  async updateQuestion(
    @CurrentUser() user: CurrentUserPayload,
    @Param('questionId') questionId: string,
    @Body() dto: UpdateQuestionDto,
  ): Promise<SuccessResponse<QuestionResponse>> {
    const updateQuestion = new UpdateQuestion(questionId, user.userId, dto.title, dto.content);
    const question = await this.questionService.updateQuestion(updateQuestion);
    return createSuccessResponse(QuestionResponse.from(question));
  }

  @Delete(':questionId')
  @UseGuards(AccessTokenGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '질문 삭제' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: '질문 삭제 성공' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음 (작성자만 가능)' })
  async deleteQuestion(
    @CurrentUser() user: CurrentUserPayload,
    @Param('questionId') questionId: string,
  ): Promise<void> {
    await this.questionService.deleteQuestion(questionId, user.userId);
  }

  @Post(':questionId/answers')
  @UseGuards(AccessTokenGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '답변 작성' })
  @ApiResponse({ status: HttpStatus.CREATED, description: '답변 작성 성공' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음 (수강생 또는 강사만 가능)' })
  async createAnswer(
    @CurrentUser() user: CurrentUserPayload,
    @Param('questionId') questionId: string,
    @Body() dto: CreateAnswerDto,
  ): Promise<SuccessResponse<AnswerResponse>> {
    const newAnswer = new NewAnswer(dto.content, user.userId, questionId);
    const answer = await this.questionService.createAnswer(newAnswer);
    return createSuccessResponse(AnswerResponse.from(answer));
  }

  @Get(':questionId/answers')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '질문에 달린 답변 목록 조회' })
  @ApiResponse({ status: HttpStatus.OK, description: '답변 목록 조회 성공' })
  async getAnswers(@Param('questionId') questionId: string): Promise<SuccessResponse<AnswerResponse[]>> {
    const answers = await this.questionService.getAnswersByQuestion(questionId);
    return createSuccessResponse(answers.map((a) => AnswerResponse.from(a)));
  }

  @Patch('answers/:answerId')
  @UseGuards(AccessTokenGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '답변 수정' })
  @ApiResponse({ status: HttpStatus.OK, description: '답변 수정 성공' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음 (작성자만 가능)' })
  async updateAnswer(
    @CurrentUser() user: CurrentUserPayload,
    @Param('answerId') answerId: string,
    @Body() dto: UpdateAnswerDto,
  ): Promise<SuccessResponse<AnswerResponse>> {
    const updateAnswer = new UpdateAnswer(answerId, user.userId, dto.content);
    const answer = await this.questionService.updateAnswer(updateAnswer);
    return createSuccessResponse(AnswerResponse.from(answer));
  }

  @Delete('answers/:answerId')
  @UseGuards(AccessTokenGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '답변 삭제' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: '답변 삭제 성공' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음 (작성자만 가능)' })
  async deleteAnswer(@CurrentUser() user: CurrentUserPayload, @Param('answerId') answerId: string): Promise<void> {
    await this.questionService.deleteAnswer(answerId, user.userId);
  }
}
