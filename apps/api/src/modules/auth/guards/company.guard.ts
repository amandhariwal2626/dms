import { Injectable, type CanActivate, type ExecutionContext } from '@nestjs/common';
import { AuthorizationService } from '../services/authorization.service';
import { CompanyAccessDeniedException } from '../exceptions/auth.exceptions';
import type { AuthenticatedRequest } from '../types/auth.types';

@Injectable()
export class CompanyGuard implements CanActivate {
  constructor(private readonly authorizationService: AuthorizationService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    if (!user.companyId) {
      throw new CompanyAccessDeniedException();
    }

    try {
      await this.authorizationService.getCurrentCompanyContext(user.id, user.companyId);
    } catch {
      throw new CompanyAccessDeniedException();
    }

    return true;
  }
}
