import { randomBytes, randomInt, timingSafeEqual } from 'crypto';

export function constantTimeComparison(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

export function secureRandomBytes(length: number): Buffer {
  return randomBytes(length);
}

export function secureRandomString(length: number): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = randomBytes(length);
  let result = '';
  for (let i = 0; i < length; i++) {
    result += charset.charAt((bytes[i] ?? 0) % charset.length);
  }
  return result;
}

export function secureRandomNumber(min: number, max: number): number {
  return randomInt(min, max);
}

export function generateOtp(length = 6): string {
  const min = 10 ** (length - 1);
  const max = 10 ** length - 1;
  return String(randomInt(min, max));
}

export function generateRecoveryCode(length = 10): string {
  const bytes = randomBytes(length);
  return bytes.toString('base64url');
}
