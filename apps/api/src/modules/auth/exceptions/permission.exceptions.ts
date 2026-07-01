import { HttpException, HttpStatus } from '@nestjs/common';

export class DuplicatePermissionCodeException extends HttpException {
  constructor(message = 'A permission with this code already exists') {
    super({ status: 'error', message, code: 'DUPLICATE_PERMISSION_CODE' }, HttpStatus.CONFLICT);
  }
}

export class DuplicatePermissionNameException extends HttpException {
  constructor(message = 'A permission with this name already exists') {
    super({ status: 'error', message, code: 'DUPLICATE_PERMISSION_NAME' }, HttpStatus.CONFLICT);
  }
}

export class PermissionNotFoundException extends HttpException {
  constructor(message = 'Permission not found') {
    super({ status: 'error', message, code: 'PERMISSION_NOT_FOUND' }, HttpStatus.NOT_FOUND);
  }
}

export class ModuleNotFoundException extends HttpException {
  constructor(message = 'Module not found') {
    super({ status: 'error', message, code: 'MODULE_NOT_FOUND' }, HttpStatus.NOT_FOUND);
  }
}

export class SystemPermissionModificationException extends HttpException {
  constructor(message = 'System permissions cannot be modified') {
    super(
      { status: 'error', message, code: 'SYSTEM_PERMISSION_MODIFICATION' },
      HttpStatus.FORBIDDEN,
    );
  }
}

export class PermissionInUseException extends HttpException {
  constructor(message = 'Permission is assigned to roles and cannot be deleted') {
    super({ status: 'error', message, code: 'PERMISSION_IN_USE' }, HttpStatus.CONFLICT);
  }
}

export class CannotArchiveSystemPermissionException extends HttpException {
  constructor(message = 'System permissions cannot be archived') {
    super(
      { status: 'error', message, code: 'CANNOT_ARCHIVE_SYSTEM_PERMISSION' },
      HttpStatus.FORBIDDEN,
    );
  }
}
