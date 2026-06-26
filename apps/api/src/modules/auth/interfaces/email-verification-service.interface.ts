export interface EmailVerificationService {
  sendVerificationEmail(userId: string, email: string): Promise<void>;
  verifyEmail(userId: string, token: string): Promise<boolean>;
  resendVerificationEmail(email: string): Promise<void>;
  generateVerificationToken(userId: string, email: string): Promise<string>;
  verifyVerificationToken(token: string): Promise<{ userId: string; email: string }>;
}
