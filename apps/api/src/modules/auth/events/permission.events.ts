export class PermissionCreatedEvent {
  static readonly eventName = 'permission.created';

  constructor(
    public readonly permissionId: string,
    public readonly createdBy: string,
  ) {}
}

export class PermissionUpdatedEvent {
  static readonly eventName = 'permission.updated';

  constructor(
    public readonly permissionId: string,
    public readonly updatedBy: string,
  ) {}
}

export class PermissionStatusChangedEvent {
  static readonly eventName = 'permission.status.changed';

  constructor(
    public readonly permissionId: string,
    public readonly newStatus: string,
    public readonly changedBy: string,
  ) {}
}

export class PermissionDeletedEvent {
  static readonly eventName = 'permission.deleted';

  constructor(
    public readonly permissionId: string,
    public readonly deletedBy: string,
  ) {}
}
