import { Injectable, type CanActivate, type ExecutionContext } from '@nestjs/common';
import { InactiveUserException } from '../exceptions/auth.exceptions';
import type { AuthenticatedRequest } from '../types/auth.types';

@Injectable()
export class ActiveUserGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    if (!user.isActive) {
      throw new InactiveUserException();
    }

    return true;
  }
}
