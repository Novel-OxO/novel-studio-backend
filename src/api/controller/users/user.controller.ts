import { Body, Controller, Delete, HttpCode, HttpStatus, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { AccessTokenGuard } from '@/api/controller/auth/access-token.guard';
import { CurrentUser, type CurrentUserPayload } from '@/api/controller/auth/current-user.decorator';
import { createSuccessResponse, type SuccessResponse } from '@/api/support/response';

import { NewUser } from '@/domain/users/new-user';
import { UpdateUser } from '@/domain/users/update-user';
import { UserService } from '@/domain/users/user.service';

import { AddUserRequest, UpdateUserRequest, UserResponse } from './user.request';

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
  async createUser(@Body() request: AddUserRequest): Promise<SuccessResponse<UserResponse>> {
    const user = await this.userService.createUser(new NewUser(request.email, request.password, request.nickname));

    const response = new UserResponse(
      user.id,
      user.email,
      user.nickname,
      user.profileImageUrl,
      user.role,
      user.createdAt,
    );

    return createSuccessResponse(response);
  }

  @Patch()
  @UseGuards(AccessTokenGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '내 정보 수정' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '정보 수정 성공',
    type: UserResponse,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: '인증되지 않은 사용자',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: '사용자를 찾을 수 없습니다',
  })
  async updateMe(
    @CurrentUser() currentUser: CurrentUserPayload,
    @Body() request: UpdateUserRequest,
  ): Promise<SuccessResponse<UserResponse>> {
    const updateUser = new UpdateUser(request.nickname, request.profileImageUrl);

    const user = await this.userService.updateUser(currentUser.userId, updateUser);

    const response = new UserResponse(
      user.id,
      user.email,
      user.nickname,
      user.profileImageUrl,
      user.role,
      user.createdAt,
    );

    return createSuccessResponse(response);
  }

  @Delete()
  @UseGuards(AccessTokenGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '회원 탈퇴' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: '회원 탈퇴 성공',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: '인증되지 않은 사용자',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: '사용자를 찾을 수 없습니다',
  })
  async deleteMe(@CurrentUser() currentUser: CurrentUserPayload): Promise<void> {
    await this.userService.deleteUser(currentUser.userId);
  }
}
