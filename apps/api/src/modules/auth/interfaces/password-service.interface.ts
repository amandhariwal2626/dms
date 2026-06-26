export interface PasswordService {
  hashPassword(password: string): Promise<string>;
  verifyPassword(password: string, hash: string): Promise<boolean>;
  generatePasswordResetToken(userId: string): Promise<string>;
  verifyPasswordResetToken(token: string): Promise<string>;
  validatePasswordStrength(password: string): { isValid: boolean; errors: string[] };
  isPasswordExpired(passwordChangedAt: Date, maxAgeDays?: number): boolean;
}
