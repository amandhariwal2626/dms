import { HttpException, HttpStatus } from '@nestjs/common';

export class UserRoleNotFoundException extends HttpException {
  constructor(message = 'User role assignment not found') {
    super({ status: 'error', message, code: 'USER_ROLE_NOT_FOUND' }, HttpStatus.NOT_FOUND);
  }
}

export class DuplicateUserRoleException extends HttpException {
  constructor(message = 'User already has this role assigned') {
    super({ status: 'error', message, code: 'DUPLICATE_USER_ROLE' }, HttpStatus.CONFLICT);
  }
}

export class CannotRemoveLastActiveRoleException extends HttpException {
  constructor(
    message = 'Cannot remove the last active role. User must have at least one active role',
  ) {
    super({ status: 'error', message, code: 'LAST_ACTIVE_ROLE' }, HttpStatus.CONFLICT);
  }
}

export class CannotRemovePrimaryRoleException extends HttpException {
  constructor(message = 'Cannot remove the primary role. Set another role as primary first') {
    super({ status: 'error', message, code: 'PRIMARY_ROLE_REMOVAL' }, HttpStatus.CONFLICT);
  }
}

export class RoleNotActiveException extends HttpException {
  constructor(message = 'Role is not active and cannot be assigned') {
    super({ status: 'error', message, code: 'ROLE_NOT_ACTIVE' }, HttpStatus.BAD_REQUEST);
  }
}

export class InvalidUserRoleStatusTransitionException extends HttpException {
  constructor(message = 'Invalid status transition for user role assignment') {
    super(
      { status: 'error', message, code: 'INVALID_USER_ROLE_STATUS_TRANSITION' },
      HttpStatus.BAD_REQUEST,
    );
  }
}
