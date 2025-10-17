import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

import { UserRole } from '@/domain/users/user';

export class AddUserRequest {
  @ApiProperty({
    description: '사용자 이메일',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: '유효한 이메일 형식이 아닙니다.' })
  email: string;

  @ApiProperty({
    description: '사용자 비밀번호 (최소 8자 이상)',
    example: 'SecurePass123!',
    minLength: 8,
  })
  @IsString({ message: '비밀번호는 문자열이어야 합니다.' })
  @MinLength(8, { message: '비밀번호는 최소 8자 이상이어야 합니다.' })
  password: string;

  @ApiProperty({
    description: '사용자 닉네임 (2-20자)',
    example: '홍길동',
    minLength: 2,
    maxLength: 20,
  })
  @IsString({ message: '닉네임은 문자열이어야 합니다.' })
  @MinLength(2, { message: '닉네임은 2자 이상이어야 합니다.' })
  @MaxLength(20, { message: '닉네임은 20자 이하여야 합니다.' })
  nickname: string;
}

export class UserResponse {
  @ApiProperty({
    description: '사용자 ID',
    example: 'clx1234567890abcdefgh',
  })
  id: string;

  @ApiProperty({
    description: '사용자 이메일',
    example: 'user@example.com',
  })
  email: string;

  @ApiProperty({
    description: '사용자 닉네임',
    example: '홍길동',
  })
  nickname: string;

  @ApiProperty({
    description: '프로필 이미지 URL',
    example: 'https://example.com/profile.jpg',
    nullable: true,
  })
  profileImageUrl: string | null;

  @ApiProperty({
    description: '사용자 권한',
    example: 'USER',
    enum: UserRole,
  })
  role: UserRole;

  @ApiProperty({
    description: '생성일시',
    example: '2023-10-17T12:00:00.000Z',
  })
  createdAt: Date;

  constructor(
    id: string,
    email: string,
    nickname: string,
    profileImageUrl: string | null,
    role: UserRole,
    createdAt: Date,
  ) {
    this.id = id;
    this.email = email;
    this.nickname = nickname;
    this.profileImageUrl = profileImageUrl;
    this.role = role;
    this.createdAt = createdAt;
  }
}
