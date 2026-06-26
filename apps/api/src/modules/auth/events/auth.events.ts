import { EVENT_NAMES } from '../constants/auth.constants';

export class UserRegisteredEvent {
  static readonly eventName = EVENT_NAMES.USER_REGISTERED;
  constructor(
    public readonly userId: string,
    public readonly email: string,
  ) {}
}

export class UserLoggedInEvent {
  static readonly eventName = EVENT_NAMES.USER_LOGGED_IN;
  constructor(
    public readonly userId: string,
    public readonly sessionId: string,
    public readonly ipAddress?: string,
  ) {}
}

export class UserLoggedOutEvent {
  static readonly eventName = EVENT_NAMES.USER_LOGGED_OUT;
  constructor(
    public readonly userId: string,
    public readonly sessionId: string,
  ) {}
}

export class PasswordResetRequestedEvent {
  static readonly eventName = EVENT_NAMES.PASSWORD_RESET_REQUESTED;
  constructor(
    public readonly userId: string,
    public readonly email: string,
  ) {}
}

export class PasswordChangedEvent {
  static readonly eventName = EVENT_NAMES.PASSWORD_CHANGED;
  constructor(public readonly userId: string) {}
}

export class EmailVerifiedEvent {
  static readonly eventName = EVENT_NAMES.EMAIL_VERIFIED;
  constructor(
    public readonly userId: string,
    public readonly email: string,
  ) {}
}

export class CompanySelectedEvent {
  static readonly eventName = EVENT_NAMES.COMPANY_SELECTED;
  constructor(
    public readonly userId: string,
    public readonly companyId: string,
    public readonly sessionId: string,
  ) {}
}

export class CompanySwitchedEvent {
  static readonly eventName = EVENT_NAMES.COMPANY_SWITCHED;
  constructor(
    public readonly userId: string,
    public readonly fromCompanyId: string | undefined,
    public readonly toCompanyId: string,
  ) {}
}
