import type { Request } from 'express';

export interface AccessTokenPayload {
  sub: string;
  sessionId: string;
  companyId?: string;
  companyUserId?: string;
  tokenVersion: number;
  iat: number;
  exp: number;
  iss?: string;
  aud?: string;
  jti?: string;
}

export interface RefreshTokenPayload {
  sub: string;
  sessionId: string;
  refreshTokenVersion: number;
  iat: number;
  exp: number;
  iss?: string;
  aud?: string;
  jti?: string;
}

export interface AuthenticatedUser {
  id: string;
  email?: string;
  isEmailVerified: boolean;
  isActive: boolean;
  sessionId?: string;
  companyId?: string;
  companyUserId?: string;
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
  companyUserId: string;
  activeRoleIds: string[];
  selectedAt: Date;
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
