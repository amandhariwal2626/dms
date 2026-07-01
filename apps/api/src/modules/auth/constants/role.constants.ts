export const ROLE_EVENT_NAMES = {
  ROLE_CREATED: 'role.created',
  ROLE_UPDATED: 'role.updated',
  ROLE_STATUS_CHANGED: 'role.status.changed',
  ROLE_CLONED: 'role.cloned',
  ROLE_DELETED: 'role.deleted',
} as const;

export const ROLE_ERRORS = {
  DUPLICATE_NAME: 'A role with this name already exists in this company',
  DUPLICATE_CODE: 'A role with this code already exists in this company',
  NOT_FOUND: 'Role not found',
  INVALID_PARENT: 'Parent role not found or belongs to a different company',
  SYSTEM_ROLE_MODIFICATION: 'System roles cannot be modified',
  SYSTEM_ROLE_CREATION: 'System roles cannot be created through the API',
  ROLE_IN_USE: 'Role is assigned to active users and cannot be deleted',
  CANNOT_DELETE_ADMIN: 'The default Company Admin role cannot be deleted',
  CANNOT_ARCHIVE_SYSTEM: 'System roles cannot be archived',
  CANNOT_DEACTIVATE_ADMIN: 'Cannot deactivate the last active Company Admin role',
  INVALID_STATUS_TRANSITION: 'Invalid status transition',
} as const;

export const ROLE_SORT_FIELDS = [
  'name',
  'code',
  'createdAt',
  'updatedAt',
  'hierarchyLevel',
  'priority',
] as const;

export const COMPANY_ADMIN_ROLE_CODE = 'COMPANY_ADMIN';
