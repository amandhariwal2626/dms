export class RoleCreatedEvent {
  static readonly eventName = 'role.created';

  constructor(
    public readonly roleId: string,
    public readonly companyId: string,
    public readonly createdBy: string,
  ) {}
}

export class RoleUpdatedEvent {
  static readonly eventName = 'role.updated';

  constructor(
    public readonly roleId: string,
    public readonly companyId: string,
    public readonly updatedBy: string,
  ) {}
}

export class RoleStatusChangedEvent {
  static readonly eventName = 'role.status.changed';

  constructor(
    public readonly roleId: string,
    public readonly companyId: string,
    public readonly newStatus: string,
    public readonly changedBy: string,
  ) {}
}

export class RoleClonedEvent {
  static readonly eventName = 'role.cloned';

  constructor(
    public readonly sourceRoleId: string,
    public readonly newRoleId: string,
    public readonly companyId: string,
    public readonly clonedBy: string,
  ) {}
}

export class RoleDeletedEvent {
  static readonly eventName = 'role.deleted';

  constructor(
    public readonly roleId: string,
    public readonly companyId: string,
    public readonly deletedBy: string,
  ) {}
}
