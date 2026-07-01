import { Injectable, Logger } from '@nestjs/common';
import { AuthRepository } from '../repositories/auth.repository';
import type { RolesResult } from '../types/authorization.types';

@Injectable()
export class RoleResolver {
  private readonly logger = new Logger(RoleResolver.name);

  constructor(private readonly authRepository: AuthRepository) {}

  async resolve(companyUserId: string): Promise<RolesResult> {
    this.logger.debug(`Resolving roles for company user ${companyUserId}`);

    const userRoles = await this.authRepository.findActiveUserRolesByCompanyUser(companyUserId);

    if (userRoles.length === 0) {
      return { roles: [], roleIds: [], roleCodes: [], primaryRole: null };
    }

    const now = new Date();

    const activeUserRoles = userRoles.filter((ur) => {
      if (!ur.isActive || ur.status !== 'ACTIVE') return false;
      if (ur.effectiveFrom && ur.effectiveFrom > now) return false;
      if (ur.effectiveTo && ur.effectiveTo < now) return false;
      return true;
    });

    if (activeUserRoles.length === 0) {
      return { roles: [], roleIds: [], roleCodes: [], primaryRole: null };
    }

    const roles = activeUserRoles.map((ur) => ({
      roleId: ur.role.id,
      name: ur.role.name,
      code: ur.role.code,
      displayName: ur.role.displayName,
      description: ur.role.description,
      roleType: ur.role.roleType,
      hierarchyLevel: ur.role.hierarchyLevel,
      priority: ur.role.priority,
      parentRoleId: ur.role.parentRoleId,
      isPrimary: ur.isPrimaryRole,
      isSystemRole: ur.role.isSystemRole,
      isUserRoleActive: ur.isActive,
    }));

    const directRoleIds = roles.map((r) => r.roleId);
    const ancestorRoleIds = await this.resolveRoleHierarchy(directRoleIds);
    const allRoleIds = [...new Set([...directRoleIds, ...ancestorRoleIds])];

    if (ancestorRoleIds.length > 0) {
      const ancestorRoles = await this.authRepository.findRolesByIds(ancestorRoleIds);

      for (const aRole of ancestorRoles) {
        if (
          !directRoleIds.includes(aRole.id) &&
          aRole.isActive &&
          !aRole.isDeleted &&
          aRole.status === 'ACTIVE'
        ) {
          roles.push({
            roleId: aRole.id,
            name: aRole.name,
            code: aRole.code,
            displayName: aRole.displayName,
            description: aRole.description,
            roleType: aRole.roleType,
            hierarchyLevel: aRole.hierarchyLevel,
            priority: aRole.priority,
            parentRoleId: aRole.parentRoleId,
            isPrimary: false,
            isSystemRole: aRole.isSystemRole,
            isUserRoleActive: true,
          });
        }
      }
    }

    const sorted = [...roles].sort((a, b) => a.priority - b.priority);
    const primaryRole = sorted.find((r) => r.isPrimary) ?? sorted[0] ?? null;

    const roleCodes = [...new Set(roles.map((r) => r.code))];

    return {
      roles: sorted,
      roleIds: allRoleIds,
      roleCodes,
      primaryRole,
    };
  }

  private async resolveRoleHierarchy(roleIds: string[]): Promise<string[]> {
    const allAncestorIds = new Set<string>();
    const roles = await this.authRepository.findRolesByIds(roleIds);

    const parentRoleIds = roles
      .filter(
        (r): r is typeof r & { parentRoleId: string } =>
          r.parentRoleId !== null && !allAncestorIds.has(r.parentRoleId),
      )
      .map((r) => r.parentRoleId);

    if (parentRoleIds.length === 0) {
      return [];
    }

    for (const id of parentRoleIds) {
      allAncestorIds.add(id);
    }

    const grandAncestorIds = await this.resolveRoleHierarchy([...allAncestorIds]);

    for (const id of grandAncestorIds) {
      allAncestorIds.add(id);
    }

    return [...allAncestorIds];
  }
}
