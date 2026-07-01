import { Injectable, Logger } from '@nestjs/common';
import { AuthRepository } from '../repositories/auth.repository';
import type { ResolvedPermission, EffectivePermissionSet } from '../types/authorization.types';

@Injectable()
export class PermissionResolver {
  private readonly logger = new Logger(PermissionResolver.name);

  constructor(private readonly authRepository: AuthRepository) {}

  async resolve(roleIds: string[]): Promise<EffectivePermissionSet> {
    this.logger.debug(`Resolving permissions for ${roleIds.length} roles`);

    if (roleIds.length === 0) {
      return { permissions: [], permissionCodes: [], moduleAccess: [], actionAccess: [] };
    }

    const rolePermissions = await this.authRepository.findActiveRolePermissionsByRoleIds(roleIds);

    const permissionMap = new Map<string, ResolvedPermission>();

    for (const rp of rolePermissions) {
      const key = rp.permission.code;

      const resolved: ResolvedPermission = {
        permissionId: rp.permission.id,
        name: rp.permission.name,
        code: rp.permission.code,
        displayName: rp.permission.displayName,
        action: rp.permission.action,
        effect: rp.effect,
        scope: rp.scope,
        module: rp.permission.module,
        feature: rp.permission.feature,
        screen: rp.permission.screen,
        permissionType: rp.permission.permissionType,
        isInherited: rp.isInherited,
        isSystemAssignment: rp.isSystemAssigned,
        roleId: rp.roleId,
      };

      const existing = permissionMap.get(key);

      if (!existing) {
        permissionMap.set(key, resolved);
      } else if (rp.effect === 'DENY') {
        permissionMap.set(key, { ...resolved, effect: 'DENY' });
      }
    }

    const permissions = [...permissionMap.values()];
    const allowedPermissions = permissions.filter((p) => p.effect === 'ALLOW');

    return {
      permissions,
      permissionCodes: allowedPermissions.map((p) => p.code),
      moduleAccess: [...new Set(allowedPermissions.map((p) => p.module))],
      actionAccess: [...new Set(allowedPermissions.map((p) => p.action))],
    };
  }
}
