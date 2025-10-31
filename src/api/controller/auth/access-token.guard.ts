import { Request } from 'express';

import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';

import { TokenService } from '@/domain/auth/token.service';

@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(private readonly tokenService: TokenService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('액세스 토큰이 필요합니다.');
    }

    try {
      const payload = this.tokenService.verifyAccessToken(token);
      request.user = {
        userId: payload.userId,
        role: payload.role,
        email: payload.email,
        nickname: payload.nickname,
        profileImageUrl: payload.profileImageUrl,
      };
    } catch {
      throw new UnauthorizedException('유효하지 않은 액세스 토큰입니다.');
    }

    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const authorization = request.headers.authorization;
    if (!authorization) {
      return undefined;
    }

    const [type, token] = authorization.split(' ');
    return type === 'Bearer' ? token : undefined;
  }
}
