export const AUTH_ERRORS = {
  INVALID_CREDENTIALS: 'Invalid email or password',
  ACCOUNT_LOCKED: 'Account is locked. Please try again later',
  EMAIL_NOT_VERIFIED: 'Email is not verified',
  PASSWORD_EXPIRED: 'Password has expired. Please reset your password',
  SESSION_EXPIRED: 'Session has expired. Please login again',
  INVALID_TOKEN: 'Invalid or malformed token',
  REFRESH_TOKEN_EXPIRED: 'Refresh token has expired. Please login again',
  COMPANY_ACCESS_DENIED: 'You do not have access to this company',
  PERMISSION_DENIED: 'You do not have permission to perform this action',
  USER_NOT_FOUND: 'User not found',
  EMAIL_ALREADY_EXISTS: 'Email is already registered',
  INVALID_OTP: 'Invalid or expired OTP',
  TOO_MANY_ATTEMPTS: 'Too many attempts. Please try again later',
} as const;

export const TOKEN_TYPES = {
  ACCESS: 'access',
  REFRESH: 'refresh',
  VERIFICATION: 'verification',
  PASSWORD_RESET: 'password_reset',
  INVITATION: 'invitation',
} as const;

export const HEADER_NAMES = {
  AUTHORIZATION: 'Authorization',
  BEARER: 'Bearer',
  REFRESH_TOKEN: 'x-refresh-token',
  COMPANY_ID: 'x-company-id',
  DEVICE_ID: 'x-device-id',
  DEVICE_TYPE: 'x-device-type',
  DEVICE_NAME: 'x-device-name',
  SESSION_ID: 'x-session-id',
  REQUEST_ID: 'x-request-id',
  TRACE_ID: 'x-trace-id',
  USER_AGENT: 'User-Agent',
  IP_ADDRESS: 'x-forwarded-for',
} as const;

export const COOKIE_NAMES = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  SESSION_ID: 'session_id',
  COMPANY_ID: 'company_id',
} as const;

export const CACHE_KEYS = {
  USER_SESSIONS: (userId: string) => `sessions:${userId}`,
  USER_REFRESH_TOKEN: (userId: string, tokenId: string) => `refresh:${userId}:${tokenId}`,
  COMPANY_USERS: (companyId: string) => `company:${companyId}:users`,
  USER_PERMISSIONS: (userId: string, companyId: string) => `permissions:${userId}:${companyId}`,
  ACCOUNT_LOCK: (userId: string) => `lock:${userId}`,
  RATE_LIMIT: (key: string) => `rate:${key}`,
  VERIFICATION_CODE: (email: string) => `verify:${email}`,
  PASSWORD_RESET: (email: string) => `reset:${email}`,
} as const;

export const LOGIN_CONSTANTS = {
  MAX_FAILED_ATTEMPTS: 5,
  LOCKOUT_DURATION_MINUTES: 15,
} as const;

export const EVENT_NAMES = {
  USER_REGISTERED: 'auth.user.registered',
  USER_LOGGED_IN: 'auth.user.logged_in',
  USER_LOGGED_OUT: 'auth.user.logged_out',
  PASSWORD_RESET_REQUESTED: 'auth.password.reset_requested',
  PASSWORD_CHANGED: 'auth.password.changed',
  EMAIL_VERIFIED: 'auth.email.verified',
  COMPANY_SELECTED: 'auth.company.selected',
  COMPANY_SWITCHED: 'auth.company.switched',
  TOKEN_REFRESHED: 'auth.token.refreshed',
  SESSION_REVOKED: 'auth.session.revoked',
} as const;
