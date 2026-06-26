import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { EnvironmentVariables } from '@/config/env.validation';

export interface JwtTokenConfig {
  secret: string;
  expiresIn: string;
  algorithm: 'HS256' | 'HS384' | 'HS512' | 'RS256';
}

@Injectable()
export class JwtConfigService {
  constructor(private readonly configService: ConfigService<EnvironmentVariables, true>) {}

  get accessToken(): JwtTokenConfig {
    return {
      secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRY'),
      algorithm: this.configService.get<JwtTokenConfig['algorithm']>('JWT_ALGORITHM'),
    };
  }

  get refreshToken(): JwtTokenConfig {
    return {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRY'),
      algorithm: this.configService.get<JwtTokenConfig['algorithm']>('JWT_ALGORITHM'),
    };
  }

  get issuer(): string {
    return this.configService.get<string>('JWT_ISSUER');
  }

  get audience(): string {
    return this.configService.get<string>('JWT_AUDIENCE');
  }
}
