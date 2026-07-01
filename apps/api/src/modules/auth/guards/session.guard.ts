import { Injectable, type CanActivate, type ExecutionContext } from '@nestjs/common';
import { AuthRepository } from '../repositories/auth.repository';
import { SessionExpiredException, SessionRevokedException } from '../exceptions/auth.exceptions';
import type { AuthenticatedRequest, SessionContext } from '../types/auth.types';

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(private readonly authRepository: AuthRepository) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    if (!user.sessionId) {
      throw new SessionExpiredException();
    }

    const session = await this.authRepository.findSessionById(user.sessionId);

    if (!session) {
      throw new SessionExpiredException();
    }

    if (session.status === 'REVOKED') {
      throw new SessionRevokedException();
    }

    const sessionContext: SessionContext = {
      sessionId: session.id,
      loginAt: session.loginAt,
      lastActivityAt: session.lastActivityAt,
    };

    const metadata = session.metadata as Record<string, string> | null;
    if (metadata?.deviceId) sessionContext.deviceId = metadata.deviceId;
    if (metadata?.deviceType) sessionContext.deviceType = metadata.deviceType;
    if (session.ipAddress) sessionContext.ipAddress = session.ipAddress;
    if (session.userAgent) sessionContext.userAgent = session.userAgent;

    request.session = sessionContext;

    return true;
  }
}
