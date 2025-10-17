import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import { User, UserRole } from '@/domain/users/user';

import { Token } from './token';
import { TokenPayload } from './token-payload';

const JWT_ACCESS_SECRET = 'JWT_ACCESS_SECRET';
const JWT_ACCESS_EXPIRATION = 'JWT_ACCESS_EXPIRATION';
const JWT_REFRESH_SECRET = 'JWT_REFRESH_SECRET';
const JWT_REFRESH_EXPIRATION = 'JWT_REFRESH_EXPIRATION';

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  createToken(user: User): Token {
    const payload = new TokenPayload(user.id, user.role);

    const accessToken = this.createAccessToken(payload);
    const refreshToken = this.createRefreshToken(payload);

    return new Token(accessToken, refreshToken);
  }

  private createAccessToken(payload: TokenPayload): string {
    const secret = this.configService.get<string>(JWT_ACCESS_SECRET);
    const expiresIn = this.configService.get<number>(JWT_ACCESS_EXPIRATION);

    return this.jwtService.sign({ userId: payload.userId, role: payload.role }, { secret, expiresIn });
  }

  private createRefreshToken(payload: TokenPayload): string {
    const secret = this.configService.get<string>(JWT_REFRESH_SECRET);
    const expiresIn = this.configService.get<number>(JWT_REFRESH_EXPIRATION);

    return this.jwtService.sign({ userId: payload.userId, role: payload.role }, { secret, expiresIn });
  }

  verifyAccessToken(token: string): TokenPayload {
    const secret = this.configService.get<string>(JWT_ACCESS_SECRET);
    const decoded = this.jwtService.verify<{ userId: string; role: UserRole }>(token, { secret });

    return new TokenPayload(decoded.userId, decoded.role);
  }

  verifyRefreshToken(token: string): TokenPayload {
    const secret = this.configService.get<string>(JWT_REFRESH_SECRET);
    const decoded = this.jwtService.verify<{ userId: string; role: UserRole }>(token, { secret });

    return new TokenPayload(decoded.userId, decoded.role);
  }
}
