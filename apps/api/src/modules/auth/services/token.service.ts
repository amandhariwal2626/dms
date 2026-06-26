import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { AccessTokenPayload, RefreshTokenPayload, TokenPair } from '../types/auth.types';
import { JwtConfigService } from './jwt-config.service';
import { InvalidTokenException, RefreshTokenExpiredException } from '../exceptions/auth.exceptions';
import { parseExpiry } from '../utils/date.util';

export interface GenerateAccessTokenPayload {
  userId: string;
  sessionId: string;
  tokenVersion: number;
}

export interface GenerateRefreshTokenPayload {
  userId: string;
  sessionId: string;
  refreshTokenVersion: number;
}

export interface GenerateTokenPairPayload {
  userId: string;
  sessionId: string;
  tokenVersion: number;
  refreshTokenVersion: number;
}

@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly jwtConfigService: JwtConfigService,
  ) {}

  async generateAccessToken(payload: GenerateAccessTokenPayload): Promise<string> {
    const config = this.jwtConfigService.accessToken;

    const tokenPayload: Omit<AccessTokenPayload, 'iat' | 'exp'> = {
      sub: payload.userId,
      sessionId: payload.sessionId,
      tokenVersion: payload.tokenVersion,
    };

    const expiresInSeconds = Math.floor(parseExpiry(config.expiresIn) / 1000);

    return this.jwtService.signAsync(tokenPayload, {
      secret: config.secret,
      expiresIn: expiresInSeconds,
      algorithm: config.algorithm,
      issuer: this.jwtConfigService.issuer,
      audience: this.jwtConfigService.audience,
    });
  }

  async generateRefreshToken(payload: GenerateRefreshTokenPayload): Promise<string> {
    const config = this.jwtConfigService.refreshToken;

    const tokenPayload: Omit<RefreshTokenPayload, 'iat' | 'exp'> = {
      sub: payload.userId,
      sessionId: payload.sessionId,
      refreshTokenVersion: payload.refreshTokenVersion,
    };

    const expiresInSeconds = Math.floor(parseExpiry(config.expiresIn) / 1000);

    return this.jwtService.signAsync(tokenPayload, {
      secret: config.secret,
      expiresIn: expiresInSeconds,
      algorithm: config.algorithm,
      issuer: this.jwtConfigService.issuer,
      audience: this.jwtConfigService.audience,
    });
  }

  async verifyAccessToken(token: string): Promise<AccessTokenPayload> {
    try {
      const config = this.jwtConfigService.accessToken;
      const payload = await this.jwtService.verifyAsync<AccessTokenPayload>(token, {
        secret: config.secret,
        algorithms: [config.algorithm],
        issuer: this.jwtConfigService.issuer,
        audience: this.jwtConfigService.audience,
      });
      return payload;
    } catch {
      throw new InvalidTokenException();
    }
  }

  async verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
    try {
      const config = this.jwtConfigService.refreshToken;
      const payload = await this.jwtService.verifyAsync<RefreshTokenPayload>(token, {
        secret: config.secret,
        algorithms: [config.algorithm],
        issuer: this.jwtConfigService.issuer,
        audience: this.jwtConfigService.audience,
      });
      return payload;
    } catch {
      throw new RefreshTokenExpiredException();
    }
  }

  decodeToken(token: string): AccessTokenPayload | RefreshTokenPayload | null {
    try {
      return this.jwtService.decode<AccessTokenPayload | RefreshTokenPayload>(token);
    } catch {
      return null;
    }
  }

  getTokenExpiry(token: string): number | null {
    const decoded = this.decodeToken(token);
    if (!decoded || typeof decoded === 'string') return null;
    if ('exp' in decoded && typeof decoded.exp === 'number') {
      return decoded.exp * 1000;
    }
    return null;
  }

  async generateTokenPair(payload: GenerateTokenPairPayload): Promise<TokenPair> {
    const accessConfig = this.jwtConfigService.accessToken;
    const refreshConfig = this.jwtConfigService.refreshToken;

    const [accessToken, refreshToken] = await Promise.all([
      this.generateAccessToken({
        userId: payload.userId,
        sessionId: payload.sessionId,
        tokenVersion: payload.tokenVersion,
      }),
      this.generateRefreshToken({
        userId: payload.userId,
        sessionId: payload.sessionId,
        refreshTokenVersion: payload.refreshTokenVersion,
      }),
    ]);

    const accessExpiryMs = parseExpiry(accessConfig.expiresIn);
    const refreshExpiryMs = parseExpiry(refreshConfig.expiresIn);
    const now = Date.now();

    return {
      accessToken,
      refreshToken,
      accessTokenExpiresAt: new Date(now + accessExpiryMs),
      refreshTokenExpiresAt: new Date(now + refreshExpiryMs),
    };
  }
}
