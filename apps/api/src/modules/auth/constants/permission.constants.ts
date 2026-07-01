export const PERMISSION_EVENT_NAMES = {
  PERMISSION_CREATED: 'permission.created',
  PERMISSION_UPDATED: 'permission.updated',
  PERMISSION_STATUS_CHANGED: 'permission.status.changed',
  PERMISSION_DELETED: 'permission.deleted',
} as const;

export const PERMISSION_ERRORS = {
  DUPLICATE_CODE: 'A permission with this code already exists',
  DUPLICATE_NAME: 'A permission with this name already exists',
  NOT_FOUND: 'Permission not found',
  MODULE_NOT_FOUND: 'Module not found',
  SYSTEM_PERMISSION_MODIFICATION: 'System permissions cannot be modified',
  PERMISSION_IN_USE: 'Permission is assigned to roles and cannot be deleted',
  CANNOT_ARCHIVE_SYSTEM: 'System permissions cannot be archived',
  INVALID_STATUS_TRANSITION: 'Invalid status transition',
} as const;

export const PERMISSION_SORT_FIELDS = [
  'name',
  'code',
  'module',
  'action',
  'permissionType',
  'status',
  'createdAt',
  'updatedAt',
] as const;
