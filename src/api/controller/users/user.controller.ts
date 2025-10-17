import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { NewUser } from '@/domain/users/new-user';
import { UserService } from '@/domain/users/user.service';

import { AddUserRequest, UserResponse } from './user.request';

@ApiTags('users')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '회원 가입' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: '회원 가입 성공',
    type: UserResponse,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: '이미 사용 중인 이메일',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: '잘못된 요청 데이터',
  })
  async createUser(@Body() request: AddUserRequest): Promise<UserResponse> {
    const user = await this.userService.createUser(new NewUser(request.email, request.password, request.nickname));

    return new UserResponse(user.id, user.email, user.nickname, user.profileImageUrl, user.role, user.createdAt);
  }
}
