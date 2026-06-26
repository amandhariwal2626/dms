import type { Request } from 'express';

export interface JwtPayload {
  sub: string;
  email: string;
  iat?: number;
  exp?: number;
  iss?: string;
  aud?: string;
  jti?: string;
}

export interface AccessTokenPayload extends JwtPayload {
  type: 'access';
  sessionId: string;
  companyId?: string;
}

export interface RefreshTokenPayload extends JwtPayload {
  type: 'refresh';
  tokenId: string;
  sessionId: string;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  isEmailVerified: boolean;
  isActive: boolean;
}

export interface SessionContext {
  sessionId: string;
  deviceId?: string;
  deviceType?: string;
  ipAddress?: string;
  userAgent?: string;
  loginAt: Date;
  lastActivityAt: Date;
}

export interface CompanyContext {
  companyId: string;
  isPrimary: boolean;
  roleIds: string[];
  permissions: string[];
}

export interface DeviceInfo {
  deviceId?: string;
  deviceName?: string;
  deviceType?: string;
  operatingSystem?: string;
  osVersion?: string;
  browser?: string;
  browserVersion?: string;
  platform?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface RequestContext {
  requestId?: string;
  traceId?: string;
  ipAddress?: string;
  userAgent?: string;
  deviceInfo?: DeviceInfo;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: Date;
  refreshTokenExpiresAt: Date;
}

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
  session?: SessionContext;
  company?: CompanyContext;
  requestContext?: RequestContext;
}

export interface PaginationRequest {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface APIResponse<T = unknown> {
  status: 'success' | 'error';
  message?: string;
  data?: T;
  errors?: unknown[];
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export interface ErrorResponse {
  status: 'error';
  message: string;
  code?: string;
  path?: string;
  timestamp?: string;
  errors?: unknown[];
}
