import { Request } from 'express';

import { createParamDecorator, ExecutionContext } from '@nestjs/common';

import { UserRole } from '@/domain/users/user';

export interface CurrentUserPayload {
  userId: string;
  role: UserRole;
  email: string;
  nickname: string;
  profileImageUrl: string | null;
}

export const CurrentUser = createParamDecorator((data: unknown, ctx: ExecutionContext): CurrentUserPayload => {
  const request = ctx.switchToHttp().getRequest<Request>();
  return request.user;
});
