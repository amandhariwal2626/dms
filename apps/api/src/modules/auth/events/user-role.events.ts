export class UserRoleAssignedEvent {
  static readonly eventName = 'user-role.assigned';

  constructor(
    public readonly companyUserId: string,
    public readonly roleId: string,
    public readonly companyId: string,
    public readonly assignedBy: string,
  ) {}
}

export class UserRoleRemovedEvent {
  static readonly eventName = 'user-role.removed';

  constructor(
    public readonly companyUserId: string,
    public readonly roleId: string,
    public readonly companyId: string,
    public readonly removedBy: string,
  ) {}
}

export class UserRoleUpdatedEvent {
  static readonly eventName = 'user-role.updated';

  constructor(
    public readonly userRoleId: string,
    public readonly companyUserId: string,
    public readonly roleId: string,
    public readonly companyId: string,
    public readonly updatedBy: string,
    public readonly changes: Record<string, unknown>,
  ) {}
}

export class PermissionCacheInvalidatedEvent {
  static readonly eventName = 'permission-cache.invalidated';

  constructor(
    public readonly companyId: string,
    public readonly userId: string,
    public readonly reason: string,
  ) {}
}
