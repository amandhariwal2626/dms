export class RolePermissionsUpdatedEvent {
  static readonly eventName = 'role.permissions.updated';

  constructor(
    public readonly roleId: string,
    public readonly companyId: string,
    public readonly updatedBy: string,
    public readonly permissionIds: string[],
  ) {}
}

export class RolePermissionsCopiedEvent {
  static readonly eventName = 'role.permissions.copied';

  constructor(
    public readonly sourceRoleId: string,
    public readonly targetRoleId: string,
    public readonly companyId: string,
    public readonly copiedBy: string,
  ) {}
}

export class RolePermissionsClearedEvent {
  static readonly eventName = 'role.permissions.cleared';

  constructor(
    public readonly roleId: string,
    public readonly companyId: string,
    public readonly clearedBy: string,
  ) {}
}
