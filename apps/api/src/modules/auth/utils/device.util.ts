import type { Request } from 'express';
import type { DeviceInfo } from '../types/auth.types';
import { HEADER_NAMES } from '../constants/auth.constants';
import { parseUserAgent } from './user-agent.util';
import { extractIpAddress } from './ip.util';

export function extractDeviceInfo(request: Request): DeviceInfo {
  const ua = request.headers[HEADER_NAMES.USER_AGENT] as string | undefined;
  const parsed = ua ? parseUserAgent(ua) : undefined;

  const info: DeviceInfo = {};
  const deviceId = request.headers[HEADER_NAMES.DEVICE_ID] as string | undefined;
  const deviceName = request.headers[HEADER_NAMES.DEVICE_NAME] as string | undefined;
  const deviceType =
    (request.headers[HEADER_NAMES.DEVICE_TYPE] as string | undefined) ?? parsed?.deviceType;

  if (deviceId) info.deviceId = deviceId;
  if (deviceName) info.deviceName = deviceName;
  if (deviceType) info.deviceType = deviceType;
  if (parsed?.browser) info.browser = parsed.browser;
  if (parsed?.browserVersion) info.browserVersion = parsed.browserVersion;
  if (parsed?.operatingSystem) info.operatingSystem = parsed.operatingSystem;
  if (parsed?.osVersion) info.osVersion = parsed.osVersion;
  if (parsed?.platform) info.platform = parsed.platform;
  if (ua) info.userAgent = ua;

  const ip = extractIpAddress(request);
  if (ip) info.ipAddress = ip;

  return info;
}
