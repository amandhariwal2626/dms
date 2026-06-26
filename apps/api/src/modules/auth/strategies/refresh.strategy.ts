import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import type { RefreshTokenPayload } from '../types/auth.types';
import { HEADER_NAMES } from '../constants/auth.constants';
import type { EnvironmentVariables } from '@/config/env.validation';

@Injectable()
export class RefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(configService: ConfigService<EnvironmentVariables, true>) {
    super({
      jwtFromRequest: ExtractJwt.fromHeader(HEADER_NAMES.REFRESH_TOKEN),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_REFRESH_SECRET', { infer: true }),
      algorithms: [configService.get('JWT_ALGORITHM', { infer: true })],
      issuer: configService.get('JWT_ISSUER', { infer: true }),
      audience: configService.get('JWT_AUDIENCE', { infer: true }),
      passReqToCallback: true,
    });
  }

  validate(
    request: Request,
    payload: RefreshTokenPayload,
  ): { payload: RefreshTokenPayload; refreshToken: string } {
    const refreshToken = request.headers[HEADER_NAMES.REFRESH_TOKEN] as string;
    return { payload, refreshToken };
  }
}
