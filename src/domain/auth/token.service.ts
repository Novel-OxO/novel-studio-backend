import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import { User } from '@/domain/users/user';

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
    const payload = new TokenPayload(user.id, user.email, user.nickname, user.profileImageUrl, user.role);

    const accessToken = this.createAccessToken(payload);
    const refreshToken = this.createRefreshToken(payload);

    return new Token(accessToken, refreshToken);
  }

  private createAccessToken(payload: TokenPayload): string {
    const secret = this.configService.get<string>(JWT_ACCESS_SECRET);
    const expiresIn = this.configService.get<number>(JWT_ACCESS_EXPIRATION);

    if (expiresIn === undefined) {
      throw Error('JWT_ACCESS_EXPIRATION is not defined');
    }

    return this.jwtService.sign(
      {
        userId: payload.userId,
        role: payload.role,
        email: payload.email,
        nickname: payload.nickname,
        profileImageUrl: payload.profileImageUrl,
      },
      { secret, expiresIn: `${expiresIn}s` },
    );
  }

  private createRefreshToken(payload: TokenPayload): string {
    const secret = this.configService.get<string>(JWT_REFRESH_SECRET);
    const expiresIn = this.configService.get<number>(JWT_REFRESH_EXPIRATION);

    if (expiresIn === undefined) {
      throw Error('JWT_REFRESH_EXPIRATION is not defined');
    }

    return this.jwtService.sign(
      {
        userId: payload.userId,
        role: payload.role,
        email: payload.email,
        nickname: payload.nickname,
        profileImageUrl: payload.profileImageUrl,
      },
      { secret, expiresIn: `${expiresIn}s` },
    );
  }

  verifyAccessToken(token: string): TokenPayload {
    const secret = this.configService.get<string>(JWT_ACCESS_SECRET);
    const decoded = this.jwtService.verify<TokenPayload>(token, { secret });

    return decoded;
  }

  verifyRefreshToken(token: string): TokenPayload {
    const secret = this.configService.get<string>(JWT_REFRESH_SECRET);
    const decoded = this.jwtService.verify<TokenPayload>(token, { secret });

    return decoded;
  }
}
