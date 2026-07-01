import { HttpException, HttpStatus } from '@nestjs/common';

export class DuplicateRoleNameException extends HttpException {
  constructor(message = 'A role with this name already exists in this company') {
    super({ status: 'error', message, code: 'DUPLICATE_ROLE_NAME' }, HttpStatus.CONFLICT);
  }
}

export class DuplicateRoleCodeException extends HttpException {
  constructor(message = 'A role with this code already exists in this company') {
    super({ status: 'error', message, code: 'DUPLICATE_ROLE_CODE' }, HttpStatus.CONFLICT);
  }
}

export class RoleNotFoundException extends HttpException {
  constructor(message = 'Role not found') {
    super({ status: 'error', message, code: 'ROLE_NOT_FOUND' }, HttpStatus.NOT_FOUND);
  }
}

export class InvalidParentRoleException extends HttpException {
  constructor(message = 'Parent role not found or belongs to a different company') {
    super({ status: 'error', message, code: 'INVALID_PARENT_ROLE' }, HttpStatus.BAD_REQUEST);
  }
}

export class SystemRoleModificationException extends HttpException {
  constructor(message = 'System roles cannot be modified') {
    super({ status: 'error', message, code: 'SYSTEM_ROLE_MODIFICATION' }, HttpStatus.FORBIDDEN);
  }
}

export class SystemRoleCreationException extends HttpException {
  constructor(message = 'System roles cannot be created through the API') {
    super({ status: 'error', message, code: 'SYSTEM_ROLE_CREATION' }, HttpStatus.FORBIDDEN);
  }
}

export class RoleInUseException extends HttpException {
  constructor(message = 'Role is assigned to active users and cannot be deleted') {
    super({ status: 'error', message, code: 'ROLE_IN_USE' }, HttpStatus.CONFLICT);
  }
}

export class CannotDeleteAdminRoleException extends HttpException {
  constructor(message = 'The default Company Admin role cannot be deleted') {
    super({ status: 'error', message, code: 'CANNOT_DELETE_ADMIN_ROLE' }, HttpStatus.FORBIDDEN);
  }
}

export class CannotArchiveSystemRoleException extends HttpException {
  constructor(message = 'System roles cannot be archived') {
    super({ status: 'error', message, code: 'CANNOT_ARCHIVE_SYSTEM_ROLE' }, HttpStatus.FORBIDDEN);
  }
}

export class CannotDeactivateAdminRoleException extends HttpException {
  constructor(message = 'Cannot deactivate the last active Company Admin role') {
    super({ status: 'error', message, code: 'CANNOT_DEACTIVATE_ADMIN_ROLE' }, HttpStatus.FORBIDDEN);
  }
}

export class InvalidStatusTransitionException extends HttpException {
  constructor(message = 'Invalid status transition') {
    super({ status: 'error', message, code: 'INVALID_STATUS_TRANSITION' }, HttpStatus.BAD_REQUEST);
  }
}
