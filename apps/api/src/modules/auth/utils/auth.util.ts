import type { Request } from 'express';
import { HEADER_NAMES } from '../constants/auth.constants';

export function extractBearerToken(request: Request): string | undefined {
  const authorization = request.headers[HEADER_NAMES.AUTHORIZATION];
  if (!authorization || typeof authorization !== 'string') return undefined;

  const parts = authorization.split(' ');
  if (parts.length !== 2) return undefined;
  if (parts[0] !== HEADER_NAMES.BEARER) return undefined;

  return parts[1];
}

export function extractClientIp(request: Request): string | undefined {
  const forwarded = request.headers[HEADER_NAMES.IP_ADDRESS];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0]?.trim();
  }
  return request.ip ?? request.socket.remoteAddress;
}

export function extractUserAgent(request: Request): string | undefined {
  const userAgent = request.headers[HEADER_NAMES.USER_AGENT];
  if (typeof userAgent === 'string') return userAgent;
  return undefined;
}

export function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

export function normalizeUsername(username: string): string {
  return username.toLowerCase().replace(/[^a-z0-9_]/g, '');
}

export interface SanitizedInput {
  email?: string;
  username?: string;
  displayName?: string;
  phone?: string;
}

export function sanitizeAuthenticationInput(input: Record<string, unknown>): SanitizedInput {
  const sanitized: SanitizedInput = {};

  if (typeof input.email === 'string') {
    sanitized.email = normalizeEmail(input.email);
  }

  if (typeof input.username === 'string') {
    sanitized.username = normalizeUsername(input.username);
  }

  if (typeof input.displayName === 'string') {
    sanitized.displayName = input.displayName.trim();
  }

  if (typeof input.phone === 'string') {
    sanitized.phone = input.phone.replace(/[^\d+]/g, '');
  }

  return sanitized;
}
