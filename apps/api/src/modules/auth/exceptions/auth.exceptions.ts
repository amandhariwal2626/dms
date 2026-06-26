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

export class DuplicateEmailException extends HttpException {
  constructor(message = 'Email is already registered') {
    super({ status: 'error', message, code: 'DUPLICATE_EMAIL' }, HttpStatus.CONFLICT);
  }
}

export class DuplicateCompanyException extends HttpException {
  constructor(message = 'Company name is already registered') {
    super({ status: 'error', message, code: 'DUPLICATE_COMPANY' }, HttpStatus.CONFLICT);
  }
}

export class WeakPasswordException extends HttpException {
  constructor(errors: string[]) {
    super(
      {
        status: 'error',
        message: 'Password does not meet strength requirements',
        errors,
        code: 'WEAK_PASSWORD',
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class TermsNotAcceptedException extends HttpException {
  constructor(message = 'You must accept the terms and conditions') {
    super({ status: 'error', message, code: 'TERMS_NOT_ACCEPTED' }, HttpStatus.BAD_REQUEST);
  }
}

export class PasswordMismatchException extends HttpException {
  constructor(message = 'Passwords do not match') {
    super({ status: 'error', message, code: 'PASSWORD_MISMATCH' }, HttpStatus.BAD_REQUEST);
  }
}

export class UserNotFoundException extends HttpException {
  constructor(message = 'User not found') {
    super({ status: 'error', message, code: 'USER_NOT_FOUND' }, HttpStatus.NOT_FOUND);
  }
}

export class InactiveCompanyException extends HttpException {
  constructor(message = 'Company is not active') {
    super({ status: 'error', message, code: 'INACTIVE_COMPANY' }, HttpStatus.FORBIDDEN);
  }
}

export class InactiveCompanyUserException extends HttpException {
  constructor(message = 'Company membership is not active') {
    super({ status: 'error', message, code: 'INACTIVE_COMPANY_USER' }, HttpStatus.FORBIDDEN);
  }
}

export class InactiveUserException extends HttpException {
  constructor(message = 'Account is not active. Please contact support') {
    super({ status: 'error', message, code: 'INACTIVE_USER' }, HttpStatus.FORBIDDEN);
  }
}

export class InvalidOtpException extends HttpException {
  constructor(message = 'Invalid or expired OTP') {
    super({ status: 'error', message, code: 'INVALID_OTP' }, HttpStatus.BAD_REQUEST);
  }
}

export class OtpExpiredException extends HttpException {
  constructor(message = 'OTP has expired. Please request a new one') {
    super({ status: 'error', message, code: 'OTP_EXPIRED' }, HttpStatus.BAD_REQUEST);
  }
}

export class TooManyAttemptsException extends HttpException {
  constructor(message = 'Too many attempts. Please try again later') {
    super({ status: 'error', message, code: 'TOO_MANY_ATTEMPTS' }, HttpStatus.TOO_MANY_REQUESTS);
  }
}

export class ReplayAttackException extends HttpException {
  constructor(message = 'Refresh token reuse detected. Session has been revoked') {
    super({ status: 'error', message, code: 'REPLAY_ATTACK' }, HttpStatus.UNAUTHORIZED);
  }
}

export class SessionRevokedException extends HttpException {
  constructor(message = 'Session has been revoked. Please login again') {
    super({ status: 'error', message, code: 'SESSION_REVOKED' }, HttpStatus.UNAUTHORIZED);
  }
}

export class ValidationFailedException extends HttpException {
  constructor(message = 'Validation failed') {
    super({ status: 'error', message, code: 'VALIDATION_FAILED' }, HttpStatus.BAD_REQUEST);
  }
}
