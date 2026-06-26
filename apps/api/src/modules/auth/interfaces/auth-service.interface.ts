import type { AuthenticatedUser, DeviceInfo, TokenPair } from '../types/auth.types';

export interface AuthService {
  register(
    email: string,
    password: string,
    deviceInfo?: DeviceInfo,
  ): Promise<{ user: AuthenticatedUser; tokens: TokenPair }>;
  login(
    email: string,
    password: string,
    deviceInfo?: DeviceInfo,
  ): Promise<{ user: AuthenticatedUser; tokens: TokenPair }>;
  refreshToken(refreshToken: string, deviceInfo?: DeviceInfo): Promise<TokenPair>;
  logout(userId: string, sessionId: string): Promise<void>;
  verifyEmail(userId: string, token: string): Promise<void>;
  forgotPassword(email: string): Promise<void>;
  resetPassword(token: string, newPassword: string): Promise<void>;
  switchCompany(userId: string, companyId: string, sessionId: string): Promise<TokenPair>;
}
