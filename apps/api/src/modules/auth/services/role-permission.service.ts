import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AuthRepository } from '../repositories/auth.repository';
import type {
  ReplacePermissionsDto,
  CopyPermissionsDto,
  PermissionsByRoleResponse,
  EffectivePermissionsResponse,
  PermissionActionResponse,
  ModulePermissionGroup,
} from '../dto/role-permission.dto';
import {
  RolePermissionsUpdatedEvent,
  RolePermissionsCopiedEvent,
  RolePermissionsClearedEvent,
} from '../events/role-permission.events';
import {
  RoleNotFoundException,
  SystemRoleModificationException,
} from '../exceptions/role.exceptions';
import { PermissionNotFoundException } from '../exceptions/permission.exceptions';
import {
  PermissionArchivedException,
  DuplicatePermissionAssignmentException,
  InactiveRoleException,
} from '../exceptions/role-permission.exceptions';
import type { Prisma } from '@prisma/client';

@Injectable()
export class RolePermissionService {
  private readonly logger = new Logger(RolePermissionService.name);

  constructor(
    private readonly authRepository: AuthRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async replacePermissions(
    roleId: string,
    companyId: string,
    userId: string,
    dto: ReplacePermissionsDto,
  ): Promise<PermissionActionResponse> {
    this.logger.log(`Replacing permissions for role ${roleId}`);

    const role = await this.authRepository.findRoleById(roleId);
    if (!role || role.companyId !== companyId) {
      throw new RoleNotFoundException();
    }

    if (!role.isActive || role.status === 'ARCHIVED') {
      throw new InactiveRoleException();
    }

    if (role.isSystemRole) {
      throw new SystemRoleModificationException();
    }

    if (dto.permissionIds.length !== new Set(dto.permissionIds).size) {
      throw new DuplicatePermissionAssignmentException();
    }

    const permissions = await this.authRepository.findPermissionsByIds(dto.permissionIds);
    if (permissions.length !== dto.permissionIds.length) {
      throw new PermissionNotFoundException();
    }

    const archivedPermission = permissions.find((p) => p.isDeprecated || !p.isActive);
    if (archivedPermission) {
      throw new PermissionArchivedException();
    }

    const uniqueModuleNames = [...new Set(permissions.map((p) => p.module))];
    const moduleNameToId = new Map<string, string>();

    for (const moduleName of uniqueModuleNames) {
      const module = await this.authRepository.findModuleByName(moduleName);
      if (module) {
        moduleNameToId.set(moduleName, module.id);
      }
    }

    await this.authRepository.$transaction(async (tx: Prisma.TransactionClient) => {
      await this.authRepository.deleteRolePermissions(roleId, tx);

      if (dto.permissionIds.length > 0) {
        const records: Prisma.RolePermissionCreateManyInput[] = dto.permissionIds.map(
          (permissionId) => {
            const permission = permissions.find((p) => p.id === permissionId);
            const moduleId = permission ? (moduleNameToId.get(permission.module) ?? '') : '';

            return {
              roleId,
              permissionId,
              moduleId,
              effect: 'ALLOW' as const,
              scope: 'GLOBAL' as const,
              createdBy: userId,
              updatedBy: userId,
            };
          },
        );

        await this.authRepository.createRolePermissions(records);
      }
    });

    this.eventEmitter.emit(
      RolePermissionsUpdatedEvent.eventName,
      new RolePermissionsUpdatedEvent(roleId, companyId, userId, dto.permissionIds),
    );

    await this.authRepository.createActivityLog({
      user: { connect: { id: userId } },
      title: 'Role Permissions Updated',
      description: `Permissions updated for role '${role.name}' (${role.code})`,
      activityType: 'DATA_UPDATE',
      module: 'AUTH',
      entityName: 'RolePermission',
      entityId: roleId,
      performedAt: new Date(),
    });

    this.logger.log(`Permissions replaced for role ${roleId}`);

    return { success: true, message: 'Role permissions updated successfully' };
  }

  async getPermissionsByRole(
    roleId: string,
    companyId: string,
  ): Promise<PermissionsByRoleResponse> {
    const role = await this.authRepository.findRoleById(roleId);
    if (!role || role.companyId !== companyId) {
      throw new RoleNotFoundException();
    }

    const rolePermissions = await this.authRepository.findRolePermissions(roleId);

    const assignedPermissionIds = new Set(
      rolePermissions.filter((rp) => !rp.isInherited).map((rp) => rp.permissionId),
    );
    const inheritedPermissionIds = new Set(
      rolePermissions.filter((rp) => rp.isInherited).map((rp) => rp.permissionId),
    );

    const moduleGroups = new Map<string, ModulePermissionGroup>();

    for (const rp of rolePermissions) {
      const perm = rp.permission;
      const moduleName = rp.module.name;
      const moduleId = rp.moduleId;

      if (!moduleGroups.has(moduleName)) {
        moduleGroups.set(moduleName, {
          module: moduleName,
          moduleId,
          features: [],
        });
      }

      const moduleGroup = moduleGroups.get(moduleName);
      if (!moduleGroup) continue;

      let featureGroup = moduleGroup.features.find((f) => f.feature === perm.feature);
      if (!featureGroup) {
        featureGroup = { feature: perm.feature, permissions: [] };
        moduleGroup.features.push(featureGroup);
      }

      featureGroup.permissions.push({
        id: perm.id,
        name: perm.name,
        code: perm.code,
        displayName: perm.displayName,
        description: perm.description,
        action: perm.action,
        permissionType: perm.permissionType,
        assigned: assignedPermissionIds.has(perm.id),
        inherited: inheritedPermissionIds.has(perm.id),
        effect: rp.effect,
        scope: rp.scope,
        feature: perm.feature,
        screen: perm.screen,
      });
    }

    return {
      success: true,
      data: {
        roleId: role.id,
        roleName: role.name,
        roleCode: role.code,
        permissions: Array.from(moduleGroups.values()),
      },
    };
  }

  async getEffectivePermissions(
    roleId: string,
    companyId: string,
  ): Promise<EffectivePermissionsResponse> {
    const role = await this.authRepository.findRoleById(roleId);
    if (!role || role.companyId !== companyId) {
      throw new RoleNotFoundException();
    }

    const rolePermissions = await this.authRepository.findRolePermissions(roleId);

    return {
      success: true,
      data: {
        roleId: role.id,
        roleName: role.name,
        roleCode: role.code,
        permissions: rolePermissions.map((rp) => ({
          id: rp.permission.id,
          name: rp.permission.name,
          code: rp.permission.code,
          displayName: rp.permission.displayName,
          action: rp.permission.action,
          effect: rp.effect,
          scope: rp.scope,
          inherited: rp.isInherited,
          isSystemAssignment: rp.isSystemAssigned,
          module: rp.module.name,
          feature: rp.permission.feature,
          screen: rp.permission.screen,
          permissionType: rp.permission.permissionType,
        })),
      },
    };
  }

  async copyPermissions(
    roleId: string,
    companyId: string,
    userId: string,
    dto: CopyPermissionsDto,
  ): Promise<PermissionActionResponse> {
    this.logger.log(`Copying permissions from role ${dto.sourceRoleId} to role ${roleId}`);

    const sourceRole = await this.authRepository.findRoleById(dto.sourceRoleId);
    if (!sourceRole || sourceRole.companyId !== companyId) {
      throw new RoleNotFoundException();
    }

    const targetRole = await this.authRepository.findRoleById(roleId);
    if (!targetRole || targetRole.companyId !== companyId) {
      throw new RoleNotFoundException();
    }

    if (targetRole.isSystemRole) {
      throw new SystemRoleModificationException();
    }

    const sourcePermissions = await this.authRepository.findRolePermissions(dto.sourceRoleId);

    if (sourcePermissions.length === 0) {
      return { success: true, message: 'Source role has no permissions to copy' };
    }

    await this.authRepository.$transaction(async (tx: Prisma.TransactionClient) => {
      await this.authRepository.deleteRolePermissions(roleId, tx);

      const records: Prisma.RolePermissionCreateManyInput[] = sourcePermissions.map((rp) => {
        const record: Prisma.RolePermissionCreateManyInput = {
          roleId,
          permissionId: rp.permissionId,
          moduleId: rp.moduleId,
          effect: rp.effect,
          scope: rp.scope,
          conditionExpression: rp.conditionExpression,
          effectiveFrom: rp.effectiveFrom,
          effectiveTo: rp.effectiveTo,
          isInherited: rp.isInherited,
          isSystemAssigned: false,
          createdBy: userId,
          updatedBy: userId,
        };

        if (rp.fieldRestrictions !== null) {
          record.fieldRestrictions = rp.fieldRestrictions;
        }

        if (rp.rowFilter !== null) {
          record.rowFilter = rp.rowFilter;
        }

        return record;
      });

      await this.authRepository.createRolePermissions(records);
    });

    this.eventEmitter.emit(
      RolePermissionsCopiedEvent.eventName,
      new RolePermissionsCopiedEvent(dto.sourceRoleId, roleId, companyId, userId),
    );

    await this.authRepository.createActivityLog({
      user: { connect: { id: userId } },
      title: 'Role Permissions Copied',
      description: `Permissions copied from role '${sourceRole.name}' to role '${targetRole.name}'`,
      activityType: 'DATA_CREATE',
      module: 'AUTH',
      entityName: 'RolePermission',
      entityId: roleId,
      performedAt: new Date(),
    });

    this.logger.log(`Permissions copied from ${dto.sourceRoleId} to ${roleId}`);

    return { success: true, message: 'Role permissions copied successfully' };
  }

  async clearPermissions(
    roleId: string,
    companyId: string,
    userId: string,
  ): Promise<PermissionActionResponse> {
    this.logger.log(`Clearing permissions for role ${roleId}`);

    const role = await this.authRepository.findRoleById(roleId);
    if (!role || role.companyId !== companyId) {
      throw new RoleNotFoundException();
    }

    if (role.isSystemRole) {
      throw new SystemRoleModificationException();
    }

    await this.authRepository.deleteRolePermissions(roleId);

    this.eventEmitter.emit(
      RolePermissionsClearedEvent.eventName,
      new RolePermissionsClearedEvent(roleId, companyId, userId),
    );

    await this.authRepository.createActivityLog({
      user: { connect: { id: userId } },
      title: 'Role Permissions Cleared',
      description: `All permissions removed from role '${role.name}' (${role.code})`,
      activityType: 'DATA_DELETE',
      module: 'AUTH',
      entityName: 'RolePermission',
      entityId: roleId,
      performedAt: new Date(),
    });

    this.logger.log(`Permissions cleared for role ${roleId}`);

    return { success: true, message: 'Role permissions cleared successfully' };
  }
}
