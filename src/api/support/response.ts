/**
 * API 공통 응답 포맷
 */

// 성공 응답 타입
export interface SuccessResponse<T> {
  success: true;
  data: T;
}

// 에러 응답 타입
export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

// API 응답 타입 (성공 또는 에러)
export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;

// 페이지네이션 메타 정보
export interface PaginationMeta {
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// 페이지네이션 응답 데이터
export interface PaginatedData<T> {
  items: T[];
  pagination: PaginationMeta;
}

// 페이지네이션 응답 타입
export type PaginatedResponse<T> = SuccessResponse<PaginatedData<T>>;

/**
 * 성공 응답 생성 헬퍼 함수
 */
export function createSuccessResponse<T>(data: T): SuccessResponse<T> {
  return {
    success: true,
    data,
  };
}

/**
 * 에러 응답 생성 헬퍼 함수
 */
export function createErrorResponse(code: string, message: string): ErrorResponse {
  return {
    success: false,
    error: {
      code,
      message,
    },
  };
}

/**
 * 페이지네이션 응답 생성 헬퍼 함수
 */
export function createPaginatedResponse<T>(
  items: T[],
  totalCount: number,
  page: number,
  pageSize: number,
): PaginatedResponse<T> {
  const totalPages = Math.ceil(totalCount / pageSize);

  return {
    success: true,
    data: {
      items,
      pagination: {
        totalCount,
        page,
        pageSize,
        totalPages,
      },
    },
  };
}

/**
 * 페이지네이션 메타 정보만 생성하는 헬퍼 함수
 */
export function createPaginationMeta(totalCount: number, page: number, pageSize: number): PaginationMeta {
  const totalPages = Math.ceil(totalCount / pageSize);

  return {
    totalCount,
    page,
    pageSize,
    totalPages,
  };
}

/**
 * 공통 에러 코드 상수
 */
export const ErrorCode = {
  // 인증 관련
  AUTH_001: 'AUTH_001',
  AUTH_002: 'AUTH_002',
  AUTH_003: 'AUTH_003',

  // Validation 관련
  VALIDATION_001: 'VALIDATION_001',
  VALIDATION_002: 'VALIDATION_002',

  // 권한 관련
  PERMISSION_001: 'PERMISSION_001',

  // 리소스 관련
  RESOURCE_001: 'RESOURCE_001',

  // 서버 에러
  SERVER_001: 'SERVER_001',
} as const;

/**
 * 공통 에러 메시지
 */
export const ErrorMessage = {
  [ErrorCode.AUTH_001]: '인증에 실패했습니다.',
  [ErrorCode.AUTH_002]: '인증 토큰이 만료되었습니다.',
  [ErrorCode.AUTH_003]: '인증 토큰이 유효하지 않습니다.',

  [ErrorCode.VALIDATION_001]: '입력값이 유효하지 않습니다.',
  [ErrorCode.VALIDATION_002]: '필수 입력값이 누락되었습니다.',

  [ErrorCode.PERMISSION_001]: '접근 권한이 없습니다.',

  [ErrorCode.RESOURCE_001]: '요청한 리소스를 찾을 수 없습니다.',

  [ErrorCode.SERVER_001]: '서버 오류가 발생했습니다.',
} as const;
