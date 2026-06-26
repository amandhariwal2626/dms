import { HttpException, HttpStatus } from '@nestjs/common';

export class InvalidCredentialsException extends HttpException {
  constructor(message = 'Invalid email or password') {
    super({ status: 'error', message, code: 'INVALID_CREDENTIALS' }, HttpStatus.UNAUTHORIZED);
  }
}

export class AccountLockedException extends HttpException {
  constructor(message = 'Account is locked. Please try again later') {
    super({ status: 'error', message, code: 'ACCOUNT_LOCKED' }, HttpStatus.FORBIDDEN);
  }
}

export class EmailNotVerifiedException extends HttpException {
  constructor(message = 'Email is not verified') {
    super({ status: 'error', message, code: 'EMAIL_NOT_VERIFIED' }, HttpStatus.FORBIDDEN);
  }
}

export class PasswordExpiredException extends HttpException {
  constructor(message = 'Password has expired. Please reset your password') {
    super({ status: 'error', message, code: 'PASSWORD_EXPIRED' }, HttpStatus.FORBIDDEN);
  }
}

export class SessionExpiredException extends HttpException {
  constructor(message = 'Session has expired. Please login again') {
    super({ status: 'error', message, code: 'SESSION_EXPIRED' }, HttpStatus.UNAUTHORIZED);
  }
}

export class InvalidTokenException extends HttpException {
  constructor(message = 'Invalid or malformed token') {
    super({ status: 'error', message, code: 'INVALID_TOKEN' }, HttpStatus.UNAUTHORIZED);
  }
}

export class RefreshTokenExpiredException extends HttpException {
  constructor(message = 'Refresh token has expired. Please login again') {
    super({ status: 'error', message, code: 'REFRESH_TOKEN_EXPIRED' }, HttpStatus.UNAUTHORIZED);
  }
}

export class CompanyAccessDeniedException extends HttpException {
  constructor(message = 'You do not have access to this company') {
    super({ status: 'error', message, code: 'COMPANY_ACCESS_DENIED' }, HttpStatus.FORBIDDEN);
  }
}

export class PermissionDeniedException extends HttpException {
  constructor(message = 'You do not have permission to perform this action') {
    super({ status: 'error', message, code: 'PERMISSION_DENIED' }, HttpStatus.FORBIDDEN);
  }
}
