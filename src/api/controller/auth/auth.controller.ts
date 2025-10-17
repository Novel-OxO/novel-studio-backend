import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { createSuccessResponse, SuccessResponse } from '@/api/support/response';

import { AuthService } from '@/domain/auth/auth.service';
import { UseCredential } from '@/domain/auth/use-credentail';

import { SignInRequest } from './auth.request';
import { SignInResponse } from './auth.response';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '로그인' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '로그인 성공',
    type: SignInResponse,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: '이메일 또는 비밀번호가 일치하지 않습니다.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: '잘못된 요청 데이터',
  })
  async signIn(@Body() request: SignInRequest): Promise<SuccessResponse<SignInResponse>> {
    const token = await this.authService.signIn(new UseCredential(request.email, request.password));

    const response = new SignInResponse(token.accessToken, token.refreshToken);

    return createSuccessResponse(response);
  }
}
