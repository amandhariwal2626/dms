import { EVENT_NAMES } from '../constants/auth.constants';

export class ProfileUpdatedEvent {
  static readonly eventName = EVENT_NAMES.PROFILE_UPDATED;
  constructor(public readonly userId: string) {}
}

export class ProfilePhotoUploadedEvent {
  static readonly eventName = EVENT_NAMES.PROFILE_PHOTO_UPLOADED;
  constructor(
    public readonly userId: string,
    public readonly fileId: string,
  ) {}
}

export class PreferencesUpdatedEvent {
  static readonly eventName = EVENT_NAMES.PREFERENCES_UPDATED;
  constructor(public readonly userId: string) {}
}
