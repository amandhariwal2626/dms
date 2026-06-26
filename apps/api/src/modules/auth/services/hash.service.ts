import { Injectable, Logger } from '@nestjs/common';
import { createHash, randomBytes, timingSafeEqual } from 'crypto';

@Injectable()
export class HashService {
  private readonly logger = new Logger(HashService.name);

  hash(data: string): string {
    return createHash('sha256').update(data).digest('hex');
  }

  compare(data: string, hashValue: string): boolean {
    const computed = this.hash(data);
    if (computed.length !== hashValue.length) return false;
    return timingSafeEqual(Buffer.from(computed), Buffer.from(hashValue));
  }

  generateRandomString(length = 32): string {
    return randomBytes(length).toString('hex');
  }

  generateRandomToken(): string {
    return randomBytes(48).toString('base64url');
  }

  generateChecksum(data: string): string {
    return createHash('md5').update(data).digest('hex');
  }
}
