import type { CookieOptions, Response } from 'express';
import { COOKIE_NAMES } from '../constants/auth.constants';

interface CookieConfig {
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'lax' | 'strict' | 'none';
  domain?: string;
  path: string;
}

const DEFAULT_COOKIE_CONFIG: CookieConfig = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
};

function buildCookieOptions(overrides: Partial<CookieConfig>): CookieOptions {
  return { ...DEFAULT_COOKIE_CONFIG, ...overrides };
}

export function createAccessCookie(response: Response, token: string, maxAge: number): void {
  response.cookie(COOKIE_NAMES.ACCESS_TOKEN, token, {
    ...buildCookieOptions({ path: '/' }),
    maxAge,
  });
}

export function clearAccessCookie(response: Response): void {
  response.clearCookie(COOKIE_NAMES.ACCESS_TOKEN, buildCookieOptions({ path: '/' }));
}

export function createRefreshCookie(response: Response, token: string, maxAge: number): void {
  response.cookie(COOKIE_NAMES.REFRESH_TOKEN, token, {
    ...buildCookieOptions({ path: '/api/auth' }),
    maxAge,
  });
}

export function clearRefreshCookie(response: Response): void {
  response.clearCookie(COOKIE_NAMES.REFRESH_TOKEN, buildCookieOptions({ path: '/api/auth' }));
}
