import { Injectable, type CanActivate, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { AuthorizationService } from '../services/authorization.service';
import { PermissionDeniedException } from '../exceptions/auth.exceptions';
import type { AuthenticatedRequest } from '../types/auth.types';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authorizationService: AuthorizationService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;
    const companyId = user.companyId;

    if (!companyId || !user) {
      throw new PermissionDeniedException();
    }

    const hasAll = await this.authorizationService.hasAllPermissions(
      user.id,
      companyId,
      requiredPermissions,
    );

    if (!hasAll) {
      throw new PermissionDeniedException();
    }

    return true;
  }
}
