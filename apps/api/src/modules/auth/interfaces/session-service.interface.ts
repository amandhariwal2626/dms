import type { DeviceInfo, SessionContext } from '../types/auth.types';

export interface SessionService {
  createSession(userId: string, deviceInfo?: DeviceInfo): Promise<SessionContext>;
  getSession(sessionId: string): Promise<SessionContext | null>;
  updateSessionActivity(sessionId: string): Promise<void>;
  endSession(sessionId: string): Promise<void>;
  endAllUserSessions(userId: string, excludeSessionId?: string): Promise<void>;
  getUserActiveSessions(userId: string): Promise<SessionContext[]>;
}
