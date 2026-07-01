import { Injectable, type CanActivate, type ExecutionContext } from '@nestjs/common';
import { EmailNotVerifiedException } from '../exceptions/auth.exceptions';
import type { AuthenticatedRequest } from '../types/auth.types';

@Injectable()
export class VerifiedEmailGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    if (!user.isEmailVerified) {
      throw new EmailNotVerifiedException();
    }

    return true;
  }
}
