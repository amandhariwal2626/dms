import { HttpException, HttpStatus } from '@nestjs/common';

export class PermissionArchivedException extends HttpException {
  constructor(message = 'One or more permissions are archived and cannot be assigned') {
    super({ status: 'error', message, code: 'PERMISSION_ARCHIVED' }, HttpStatus.BAD_REQUEST);
  }
}

export class DuplicatePermissionAssignmentException extends HttpException {
  constructor(message = 'Duplicate permission IDs found in the request') {
    super(
      { status: 'error', message, code: 'DUPLICATE_PERMISSION_ASSIGNMENT' },
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class InactiveRoleException extends HttpException {
  constructor(message = 'Cannot modify permissions for an inactive or archived role') {
    super({ status: 'error', message, code: 'INACTIVE_ROLE' }, HttpStatus.BAD_REQUEST);
  }
}
