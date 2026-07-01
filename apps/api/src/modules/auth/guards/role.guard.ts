import { Injectable, type CanActivate, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { AuthorizationService } from '../services/authorization.service';
import { PermissionDeniedException } from '../exceptions/auth.exceptions';
import type { AuthenticatedRequest } from '../types/auth.types';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authorizationService: AuthorizationService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;
    const companyId = user.companyId;

    if (!companyId || !user) {
      throw new PermissionDeniedException();
    }

    const hasRole = await this.authorizationService.hasAnyRole(user.id, companyId, requiredRoles);

    if (!hasRole) {
      throw new PermissionDeniedException();
    }

    return true;
  }
}
