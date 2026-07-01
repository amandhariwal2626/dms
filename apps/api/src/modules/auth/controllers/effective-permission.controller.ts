import { Controller, Get, UseGuards, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../decorators/current-user.decorator';
import { AuthorizationService } from '../services/authorization.service';
import type { AuthenticatedUser } from '../types/auth.types';

interface EffectivePermissionResponse {
  success: true;
  data: {
    currentCompany: {
      companyId: string;
      companyCode: string;
      displayName: string | null;
    };
    companyUser: {
      companyUserId: string;
    };
    roles: Array<{
      id: string;
      name: string;
      code: string;
      isPrimaryRole: boolean;
    }>;
    permissions: Array<{
      permissionId: string;
      module: string;
      feature: string | null;
      action: string;
      code: string;
      effect: string;
      scope: string;
    }>;
  };
}

interface EffectiveRolesResponse {
  success: true;
  data: {
    currentCompany: {
      companyId: string;
      companyCode: string;
      displayName: string | null;
    };
    companyUser: {
      companyUserId: string;
    };
    roles: Array<{
      roleId: string;
      name: string;
      code: string;
      displayName: string | null;
      description: string | null;
      roleType: string;
      hierarchyLevel: number;
      priority: number;
      parentRoleId: string | null;
      isPrimary: boolean;
      isSystemRole: boolean;
      isUserRoleActive: boolean;
    }>;
  };
}

@UseGuards(AuthGuard('jwt'))
@Controller('auth')
export class EffectivePermissionController {
  private readonly logger = new Logger(EffectivePermissionController.name);

  constructor(private readonly authorizationService: AuthorizationService) {}

  @Get('effective-permissions')
  async getEffectivePermissions(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<EffectivePermissionResponse> {
    const companyId = user.companyId ?? '';
    const userId = user.id;

    const companyContext = await this.authorizationService.getCurrentCompanyContext(
      userId,
      companyId,
    );

    const roles = await this.authorizationService.getEffectiveRoles(userId, companyId);
    const permissions = await this.authorizationService.getEffectivePermissions(userId, companyId);

    return {
      success: true,
      data: {
        currentCompany: {
          companyId: companyContext.companyId,
          companyCode: companyContext.companyCode,
          displayName: companyContext.displayName,
        },
        companyUser: {
          companyUserId: companyContext.companyUserId,
        },
        roles: roles.map((role) => ({
          id: role.roleId,
          name: role.name,
          code: role.code,
          isPrimaryRole: role.isPrimary,
        })),
        permissions: permissions.map((perm) => ({
          permissionId: perm.permissionId,
          module: perm.module,
          feature: perm.feature,
          action: perm.action,
          code: perm.code,
          effect: perm.effect,
          scope: perm.scope,
        })),
      },
    };
  }

  @Get('effective-roles')
  async getEffectiveRoles(@CurrentUser() user: AuthenticatedUser): Promise<EffectiveRolesResponse> {
    const companyId = user.companyId ?? '';
    const userId = user.id;

    const companyContext = await this.authorizationService.getCurrentCompanyContext(
      userId,
      companyId,
    );

    const roles = await this.authorizationService.getEffectiveRoles(userId, companyId);

    return {
      success: true,
      data: {
        currentCompany: {
          companyId: companyContext.companyId,
          companyCode: companyContext.companyCode,
          displayName: companyContext.displayName,
        },
        companyUser: {
          companyUserId: companyContext.companyUserId,
        },
        roles: roles.map((role) => ({
          roleId: role.roleId,
          name: role.name,
          code: role.code,
          displayName: role.displayName,
          description: role.description,
          roleType: role.roleType,
          hierarchyLevel: role.hierarchyLevel,
          priority: role.priority,
          parentRoleId: role.parentRoleId,
          isPrimary: role.isPrimary,
          isSystemRole: role.isSystemRole,
          isUserRoleActive: role.isUserRoleActive,
        })),
      },
    };
  }
}
