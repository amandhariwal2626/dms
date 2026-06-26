import type { Request } from 'express';
import { HEADER_NAMES } from '../constants/auth.constants';

export function extractIpAddress(request: Request): string | undefined {
  const forwarded = request.headers[HEADER_NAMES.IP_ADDRESS];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0]?.trim();
  }
  return request.ip ?? request.socket.remoteAddress;
}

export function isIpInWhitelist(ip: string, whitelist: string[]): boolean {
  return whitelist.some((allowed) => {
    if (allowed.includes('/')) {
      return isIpInCidr(ip, allowed);
    }
    return ip === allowed;
  });
}

function isIpInCidr(ip: string, cidr: string): boolean {
  return ip.startsWith(cidr.split('/')[0] ?? '');
}
