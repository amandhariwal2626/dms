import { Injectable, Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { validatePasswordStrength } from '../validators/password.validator';

const BCRYPT_SALT_ROUNDS = 12;

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
}

@Injectable()
export class PasswordService {
  private readonly logger = new Logger(PasswordService.name);

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  validatePasswordStrength(password: string): PasswordValidationResult {
    return validatePasswordStrength(password);
  }

  generateTemporaryPassword(): string {
    const length = 16;
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const digits = '0123456789';
    const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    const all = uppercase + lowercase + digits + special;

    const randomChar = (chars: string): string => {
      const byte = randomBytes(1)[0];
      return chars.charAt((byte ?? 0) % chars.length);
    };

    const required = [
      randomChar(uppercase),
      randomChar(lowercase),
      randomChar(digits),
      randomChar(special),
    ];

    const remaining = Array.from({ length: length - 4 }, () => randomChar(all));

    const password = [...required, ...remaining].sort(() => Math.random() - 0.5).join('');

    return password;
  }
}
