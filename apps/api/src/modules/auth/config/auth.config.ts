import { registerAs } from '@nestjs/config';

export const authConfig = registerAs('auth', () => ({
  accessToken: {
    secret: process.env.JWT_ACCESS_SECRET ?? '',
    expiresIn: process.env.JWT_ACCESS_EXPIRY ?? '15m',
    algorithm: process.env.JWT_ALGORITHM ?? 'HS256',
  },
  refreshToken: {
    secret: process.env.JWT_REFRESH_SECRET ?? '',
    expiresIn: process.env.JWT_REFRESH_EXPIRY ?? '7d',
    algorithm: process.env.JWT_ALGORITHM ?? 'HS256',
  },
  issuer: process.env.JWT_ISSUER ?? 'dms-api',
  audience: process.env.JWT_AUDIENCE ?? 'dms-client',
}));
