import { randomBytes } from 'crypto';

export function generateToken(length = 32): string {
  return randomBytes(length).toString('hex');
}

export function generateSecureToken(): string {
  return randomBytes(48).toString('base64url');
}
