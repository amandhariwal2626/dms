import { HttpException, HttpStatus } from '@nestjs/common';

export class CompanyContextMissingException extends HttpException {
  constructor(message = 'Company context not found') {
    super({ status: 'error', message, code: 'COMPANY_CONTEXT_MISSING' }, HttpStatus.FORBIDDEN);
  }
}

export class MembershipMissingException extends HttpException {
  constructor(message = 'User is not a member of this company') {
    super({ status: 'error', message, code: 'MEMBERSHIP_MISSING' }, HttpStatus.FORBIDDEN);
  }
}

export class InactiveMembershipException extends HttpException {
  constructor(message = 'User membership is inactive or terminated') {
    super({ status: 'error', message, code: 'INACTIVE_MEMBERSHIP' }, HttpStatus.FORBIDDEN);
  }
}

export class PermissionResolutionFailedException extends HttpException {
  constructor(message = 'Failed to resolve permissions') {
    super(
      { status: 'error', message, code: 'PERMISSION_RESOLUTION_FAILED' },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}

export class RoleResolutionFailedException extends HttpException {
  constructor(message = 'Failed to resolve user roles') {
    super(
      { status: 'error', message, code: 'ROLE_RESOLUTION_FAILED' },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
