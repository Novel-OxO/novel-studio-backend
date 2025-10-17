import { Response } from 'express';

import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';

import { createErrorResponse, ErrorCode, ErrorMessage } from './response';

/**
 * 글로벌 Exception Filter
 * 모든 예외를 캐치하여 공통 응답 포맷으로 변환
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let statusCode: number;
    let errorCode: string;
    let errorMessage: string;

    if (exception instanceof HttpException) {
      // NestJS HttpException 처리
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        errorMessage = exceptionResponse;
        errorCode = this.getErrorCodeByStatus(statusCode);
      } else if (typeof exceptionResponse === 'object') {
        const responseObj = exceptionResponse as any;
        errorMessage = responseObj.message || exception.message;
        errorCode = responseObj.code || this.getErrorCodeByStatus(statusCode);

        // Validation 에러의 경우 메시지 배열을 문자열로 변환
        if (Array.isArray(errorMessage)) {
          errorMessage = errorMessage.join(', ');
        }
      } else {
        errorMessage = exception.message;
        errorCode = this.getErrorCodeByStatus(statusCode);
      }
    } else {
      // 알 수 없는 예외
      statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      errorCode = ErrorCode.SERVER_001;
      errorMessage = ErrorMessage[ErrorCode.SERVER_001];

      this.logger.error('Unknown exception', exception);
    }

    const errorResponse = createErrorResponse(errorCode, errorMessage);
    response.status(statusCode).json(errorResponse);
  }

  /**
   * HTTP 상태 코드에 따른 에러 코드 매핑
   */
  private getErrorCodeByStatus(status: number): string {
    switch (status) {
      case HttpStatus.UNAUTHORIZED:
        return ErrorCode.AUTH_001;
      case HttpStatus.FORBIDDEN:
        return ErrorCode.PERMISSION_001;
      case HttpStatus.NOT_FOUND:
        return ErrorCode.RESOURCE_001;
      case HttpStatus.BAD_REQUEST:
        return ErrorCode.VALIDATION_001;
      default:
        return ErrorCode.SERVER_001;
    }
  }
}
