import type { CookieOptions, Response } from 'express';
import { COOKIE_NAMES } from '../constants/auth.constants';

const DEFAULT_COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
};

export function setAccessTokenCookie(response: Response, token: string, maxAge: number): void {
  response.cookie(COOKIE_NAMES.ACCESS_TOKEN, token, {
    ...DEFAULT_COOKIE_OPTIONS,
    maxAge,
  });
}

export function setRefreshTokenCookie(response: Response, token: string, maxAge: number): void {
  response.cookie(COOKIE_NAMES.REFRESH_TOKEN, token, {
    ...DEFAULT_COOKIE_OPTIONS,
    maxAge,
    path: '/api/auth',
  });
}

export function clearAuthCookies(response: Response): void {
  response.clearCookie(COOKIE_NAMES.ACCESS_TOKEN, DEFAULT_COOKIE_OPTIONS);
  response.clearCookie(COOKIE_NAMES.REFRESH_TOKEN, {
    ...DEFAULT_COOKIE_OPTIONS,
    path: '/api/auth',
  });
}
