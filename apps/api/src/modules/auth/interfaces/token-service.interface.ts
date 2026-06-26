import type { AccessTokenPayload, RefreshTokenPayload, TokenPair } from '../types/auth.types';

export interface TokenService {
  generateTokenPair(payload: {
    userId: string;
    email: string;
    sessionId: string;
  }): Promise<TokenPair>;
  generateAccessToken(
    payload: Omit<AccessTokenPayload, 'iat' | 'exp' | 'iss' | 'aud'>,
  ): Promise<string>;
  generateRefreshToken(
    payload: Omit<RefreshTokenPayload, 'iat' | 'exp' | 'iss' | 'aud'>,
  ): Promise<string>;
  verifyAccessToken(token: string): Promise<AccessTokenPayload>;
  verifyRefreshToken(token: string): Promise<RefreshTokenPayload>;
  revokeRefreshToken(tokenId: string): Promise<void>;
  revokeAllUserTokens(userId: string): Promise<void>;
}
