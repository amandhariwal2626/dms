import { Injectable } from '@nestjs/common';
import { randomBytes, createHash } from 'crypto';
import type { DeviceInfo } from '../types/auth.types';

@Injectable()
export class SessionTokenService {
  generateSessionIdentifier(): string {
    const id = randomBytes(24).toString('base64url');
    return `sess_${id}`;
  }

  generateDeviceFingerprint(deviceInfo: DeviceInfo): string {
    const raw = [
      deviceInfo.deviceId,
      deviceInfo.deviceName,
      deviceInfo.deviceType,
      deviceInfo.operatingSystem,
      deviceInfo.browser,
      deviceInfo.userAgent,
    ]
      .filter(Boolean)
      .join('|');

    return createHash('sha256').update(raw).digest('hex');
  }

  generateRefreshTokenIdentifier(): string {
    const id = randomBytes(32).toString('base64url');
    return `ref_${id}`;
  }

  generateAccessTokenIdentifier(): string {
    const id = randomBytes(16).toString('base64url');
    return `at_${id}`;
  }
}
