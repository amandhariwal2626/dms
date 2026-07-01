import { EVENT_NAMES } from '../constants/auth.constants';

export class UserInvitationCreatedEvent {
  static readonly eventName = EVENT_NAMES.USER_INVITATION_CREATED;
  constructor(
    public readonly invitationId: string,
    public readonly email: string,
    public readonly companyId: string,
  ) {}
}

export class UserInvitationAcceptedEvent {
  static readonly eventName = EVENT_NAMES.USER_INVITATION_ACCEPTED;
  constructor(
    public readonly invitationId: string,
    public readonly userId: string,
    public readonly companyId: string,
  ) {}
}

export class UserInvitationCancelledEvent {
  static readonly eventName = EVENT_NAMES.USER_INVITATION_CANCELLED;
  constructor(
    public readonly invitationId: string,
    public readonly companyId: string,
  ) {}
}
