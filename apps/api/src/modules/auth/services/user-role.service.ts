import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AuthRepository } from '../repositories/auth.repository';
import type {
  AssignRolesDto,
  ReplaceRolesDto,
  UpdateUserRoleStatusDto,
  UpdateUserRoleDto,
  UserRolesListResponse,
  UserRoleActionResponse,
} from '../dto/user-role.dto';
import {
  UserRoleAssignedEvent,
  UserRoleRemovedEvent,
  UserRoleUpdatedEvent,
} from '../events/user-role.events';
import { RoleNotFoundException } from '../exceptions/role.exceptions';
import { AuthorizationService } from './authorization.service';
import {
  DuplicateUserRoleException,
  CannotRemoveLastActiveRoleException,
  CannotRemovePrimaryRoleException,
  RoleNotActiveException,
  UserRoleNotFoundException,
} from '../exceptions/user-role.exceptions';
import type { Prisma } from '@prisma/client';

@Injectable()
export class UserRoleService {
  private readonly logger = new Logger(UserRoleService.name);

  constructor(
    private readonly authRepository: AuthRepository,
    private readonly eventEmitter: EventEmitter2,
    private readonly authorizationService: AuthorizationService,
  ) {}

  async getRolesByUser(userId: string, companyId: string): Promise<UserRolesListResponse> {
    const companyUser = await this.authRepository.findCompanyUser(companyId, userId);
    if (!companyUser) {
      throw new RoleNotFoundException();
    }

    const userRoles = await this.authRepository.findUserRolesByCompanyUserId(companyUser.id);

    return {
      success: true,
      data: {
        companyUserId: companyUser.id,
        userId: companyUser.userId,
        roles: userRoles.map((ur) => ({
          id: ur.id,
          roleId: ur.roleId,
          roleName: ur.role.name,
          roleCode: ur.role.code,
          roleDisplayName: ur.role.displayName,
          isPrimary: ur.isPrimaryRole,
          priority: ur.priority,
          isActive: ur.isActive,
          status: ur.status,
          effectiveFrom: ur.effectiveFrom?.toISOString() ?? null,
          effectiveTo: ur.effectiveTo?.toISOString() ?? null,
          assignedAt: ur.assignedAt.toISOString(),
          assignedBy: ur.assignedBy,
          assignmentReason: ur.assignmentReason,
        })),
      },
    };
  }

  async getProfileRoles(
    userId: string,
    companyId: string,
    companyUserId: string,
  ): Promise<UserRolesListResponse> {
    const userRoles = await this.authRepository.findUserRolesByCompanyUserId(companyUserId);

    return {
      success: true,
      data: {
        companyUserId,
        userId,
        roles: userRoles.map((ur) => ({
          id: ur.id,
          roleId: ur.roleId,
          roleName: ur.role.name,
          roleCode: ur.role.code,
          roleDisplayName: ur.role.displayName,
          isPrimary: ur.isPrimaryRole,
          priority: ur.priority,
          isActive: ur.isActive,
          status: ur.status,
          effectiveFrom: ur.effectiveFrom?.toISOString() ?? null,
          effectiveTo: ur.effectiveTo?.toISOString() ?? null,
          assignedAt: ur.assignedAt.toISOString(),
          assignedBy: ur.assignedBy,
          assignmentReason: ur.assignmentReason,
        })),
      },
    };
  }

  async assignRoles(
    userId: string,
    companyId: string,
    currentUserId: string,
    dto: AssignRolesDto,
  ): Promise<UserRoleActionResponse> {
    this.logger.log(`Assigning roles to user ${userId} in company ${companyId}`);

    const companyUser = await this.authRepository.findCompanyUser(companyId, userId);
    if (!companyUser) {
      throw new RoleNotFoundException();
    }

    const roles = await this.authRepository.findRolesByIds(dto.roleIds);
    if (roles.length !== dto.roleIds.length) {
      throw new RoleNotFoundException();
    }

    for (const role of roles) {
      if (role.companyId !== companyId) {
        throw new RoleNotFoundException();
      }
      if (!role.isActive || role.status === 'ARCHIVED' || role.status === 'INACTIVE') {
        throw new RoleNotActiveException();
      }
    }

    const existingUserRoles = await this.authRepository.findUserRolesByCompanyUserId(
      companyUser.id,
    );
    const existingRoleIds = new Set(existingUserRoles.map((ur) => ur.roleId));

    const duplicates = dto.roleIds.filter((rid) => existingRoleIds.has(rid));
    if (duplicates.length > 0) {
      throw new DuplicateUserRoleException();
    }

    await this.authRepository.$transaction(async (tx: Prisma.TransactionClient) => {
      for (const role of roles) {
        await this.authRepository.createUserRole(
          {
            companyUser: { connect: { id: companyUser.id } },
            role: { connect: { id: role.id } },
            assignedBy: currentUserId,
            assignmentReason: dto.assignmentReason ?? null,
            effectiveFrom: dto.effectiveFrom ? new Date(dto.effectiveFrom) : null,
            effectiveTo: dto.effectiveTo ? new Date(dto.effectiveTo) : null,
            priority: dto.priority ?? 0,
            isPrimaryRole: dto.isPrimaryRole ?? false,
            status: 'ACTIVE',
            isActive: true,
            source: 'MANUAL',
            scope: 'COMPANY',
          },
          tx,
        );
      }
    });

    for (const role of roles) {
      this.eventEmitter.emit(
        UserRoleAssignedEvent.eventName,
        new UserRoleAssignedEvent(companyUser.id, role.id, companyId, currentUserId),
      );
    }

    this.authorizationService.onUserRoleChanged(userId, companyId);

    await this.authRepository.createActivityLog({
      user: { connect: { id: currentUserId } },
      title: 'Roles Assigned',
      description: `Roles [${roles.map((r) => r.name).join(', ')}] assigned to user`,
      activityType: 'DATA_CREATE',
      module: 'AUTH',
      entityName: 'UserRole',
      entityId: companyUser.id,
      performedAt: new Date(),
    });

    this.logger.log(`Roles assigned to user ${userId}`);

    const firstRole = roles[0] as NonNullable<(typeof roles)[0]>;
    return {
      success: true,
      message: `Roles assigned successfully`,
      data: {
        id: firstRole.id,
        roleId: firstRole.id,
        roleName: firstRole.name,
        roleCode: firstRole.code,
      },
    };
  }

  async replaceRoles(
    userId: string,
    companyId: string,
    currentUserId: string,
    dto: ReplaceRolesDto,
  ): Promise<UserRoleActionResponse> {
    this.logger.log(`Replacing roles for user ${userId} in company ${companyId}`);

    const companyUser = await this.authRepository.findCompanyUser(companyId, userId);
    if (!companyUser) {
      throw new RoleNotFoundException();
    }

    const roles = await this.authRepository.findRolesByIds(dto.roleIds);
    if (roles.length !== dto.roleIds.length) {
      throw new RoleNotFoundException();
    }

    for (const role of roles) {
      if (role.companyId !== companyId) {
        throw new RoleNotFoundException();
      }
      if (!role.isActive || role.status === 'ARCHIVED' || role.status === 'INACTIVE') {
        throw new RoleNotActiveException();
      }
    }

    const existingUserRoles = await this.authRepository.findUserRolesByCompanyUserId(
      companyUser.id,
    );

    await this.authRepository.$transaction(async (tx: Prisma.TransactionClient) => {
      for (const existing of existingUserRoles) {
        await this.authRepository.softDeleteUserRole(existing.id);
      }

      for (const role of roles) {
        const isPrimary =
          existingUserRoles.length === 0 ? true : role.id === existingUserRoles[0]?.roleId;

        await this.authRepository.createUserRole(
          {
            companyUser: { connect: { id: companyUser.id } },
            role: { connect: { id: role.id } },
            assignedBy: currentUserId,
            assignmentReason: dto.assignmentReason ?? 'Role replacement',
            priority: 0,
            isPrimaryRole: isPrimary,
            status: 'ACTIVE',
            isActive: true,
            source: 'MANUAL',
            scope: 'COMPANY',
          },
          tx,
        );
      }
    });

    this.authorizationService.onUserRoleChanged(userId, companyId);

    await this.authRepository.createActivityLog({
      user: { connect: { id: currentUserId } },
      title: 'Roles Replaced',
      description: `Roles replaced for user. New roles: [${roles.map((r) => r.name).join(', ')}]`,
      activityType: 'DATA_UPDATE',
      module: 'AUTH',
      entityName: 'UserRole',
      entityId: companyUser.id,
      performedAt: new Date(),
    });

    this.logger.log(`Roles replaced for user ${userId}`);

    return {
      success: true,
      message: 'Roles replaced successfully',
    };
  }

  async removeRole(
    userId: string,
    roleId: string,
    companyId: string,
    currentUserId: string,
  ): Promise<UserRoleActionResponse> {
    this.logger.log(`Removing role ${roleId} from user ${userId}`);

    const companyUser = await this.authRepository.findCompanyUser(companyId, userId);
    if (!companyUser) {
      throw new RoleNotFoundException();
    }

    const userRole = await this.authRepository.findActiveUserRoleByCompanyUserAndRoleId(
      companyUser.id,
      roleId,
    );
    if (!userRole) {
      throw new UserRoleNotFoundException();
    }

    if (userRole.isPrimaryRole) {
      throw new CannotRemovePrimaryRoleException();
    }

    const activeCount = await this.authRepository.countActiveUserRolesByCompanyUser(companyUser.id);
    if (activeCount <= 1) {
      throw new CannotRemoveLastActiveRoleException();
    }

    await this.authRepository.softDeleteUserRole(userRole.id);

    this.eventEmitter.emit(
      UserRoleRemovedEvent.eventName,
      new UserRoleRemovedEvent(companyUser.id, roleId, companyId, currentUserId),
    );

    this.authorizationService.onUserRoleChanged(userId, companyId);

    await this.authRepository.createActivityLog({
      user: { connect: { id: currentUserId } },
      title: 'Role Removed',
      description: `Role '${userRole.role.name}' removed from user`,
      activityType: 'DATA_DELETE',
      module: 'AUTH',
      entityName: 'UserRole',
      entityId: userRole.id,
      performedAt: new Date(),
    });

    this.logger.log(`Role ${roleId} removed from user ${userId}`);

    return {
      success: true,
      message: 'Role removed successfully',
      data: {
        id: userRole.id,
        roleId: roleId,
        roleName: userRole.role.name,
        roleCode: userRole.role.code,
      },
    };
  }

  async updateUserRoleStatus(
    userId: string,
    roleId: string,
    companyId: string,
    currentUserId: string,
    dto: UpdateUserRoleStatusDto,
  ): Promise<UserRoleActionResponse> {
    this.logger.log(`Updating role status for user ${userId} role ${roleId}`);

    const companyUser = await this.authRepository.findCompanyUser(companyId, userId);
    if (!companyUser) {
      throw new RoleNotFoundException();
    }

    const userRole = await this.authRepository.findActiveUserRoleByCompanyUserAndRoleId(
      companyUser.id,
      roleId,
    );
    if (!userRole) {
      throw new UserRoleNotFoundException();
    }

    if (dto.status === 'INACTIVE') {
      const activeCount = await this.authRepository.countActiveUserRolesByCompanyUser(
        companyUser.id,
      );
      if (activeCount <= 1) {
        throw new CannotRemoveLastActiveRoleException();
      }
    }

    const isActive = dto.status === 'ACTIVE';
    const updated = await this.authRepository.updateUserRole(userRole.id, {
      status: dto.status,
      isActive,
    });

    this.eventEmitter.emit(
      UserRoleUpdatedEvent.eventName,
      new UserRoleUpdatedEvent(userRole.id, companyUser.id, roleId, companyId, currentUserId, {
        status: dto.status,
      }),
    );

    this.authorizationService.onUserRoleChanged(userId, companyId);

    await this.authRepository.createActivityLog({
      user: { connect: { id: currentUserId } },
      title: 'User Role Status Updated',
      description: `User role '${userRole.role.name}' status changed to ${dto.status}`,
      activityType: 'DATA_UPDATE',
      module: 'AUTH',
      entityName: 'UserRole',
      entityId: userRole.id,
      performedAt: new Date(),
    });

    this.logger.log(`Role ${roleId} status updated to ${dto.status} for user ${userId}`);

    return {
      success: true,
      message: `Role status updated to ${dto.status}`,
      data: {
        id: updated.id,
        roleId: updated.roleId,
        roleName: updated.role.name,
        roleCode: updated.role.code,
      },
    };
  }

  async updateUserRole(
    userId: string,
    roleId: string,
    companyId: string,
    currentUserId: string,
    dto: UpdateUserRoleDto,
  ): Promise<UserRoleActionResponse> {
    this.logger.log(`Updating user role ${roleId} for user ${userId}`);

    const companyUser = await this.authRepository.findCompanyUser(companyId, userId);
    if (!companyUser) {
      throw new RoleNotFoundException();
    }

    const userRole = await this.authRepository.findActiveUserRoleByCompanyUserAndRoleId(
      companyUser.id,
      roleId,
    );
    if (!userRole) {
      throw new UserRoleNotFoundException();
    }

    const updateData: Prisma.UserRoleUpdateInput = {};

    if (dto.priority !== undefined) {
      updateData.priority = dto.priority;
    }
    if (dto.isPrimaryRole !== undefined) {
      updateData.isPrimaryRole = dto.isPrimaryRole;

      if (dto.isPrimaryRole) {
        await this.authRepository.setPrimaryRole(companyUser.id, userRole.id);
      }
    }
    if (dto.effectiveFrom !== undefined) {
      updateData.effectiveFrom = dto.effectiveFrom ? new Date(dto.effectiveFrom) : null;
    }
    if (dto.effectiveTo !== undefined) {
      updateData.effectiveTo = dto.effectiveTo ? new Date(dto.effectiveTo) : null;
    }

    const updated = await this.authRepository.updateUserRole(userRole.id, updateData);

    const changes: Record<string, unknown> = {};
    if (dto.priority !== undefined) changes.priority = dto.priority;
    if (dto.isPrimaryRole !== undefined) changes.isPrimaryRole = dto.isPrimaryRole;
    if (dto.effectiveFrom !== undefined) changes.effectiveFrom = dto.effectiveFrom;
    if (dto.effectiveTo !== undefined) changes.effectiveTo = dto.effectiveTo;

    this.eventEmitter.emit(
      UserRoleUpdatedEvent.eventName,
      new UserRoleUpdatedEvent(
        userRole.id,
        companyUser.id,
        roleId,
        companyId,
        currentUserId,
        changes,
      ),
    );

    this.authorizationService.onUserRoleChanged(userId, companyId);

    await this.authRepository.createActivityLog({
      user: { connect: { id: currentUserId } },
      title: 'User Role Updated',
      description: `User role '${userRole.role.name}' updated`,
      activityType: 'DATA_UPDATE',
      module: 'AUTH',
      entityName: 'UserRole',
      entityId: userRole.id,
      performedAt: new Date(),
    });

    this.logger.log(`User role ${roleId} updated for user ${userId}`);

    return {
      success: true,
      message: 'User role updated successfully',
      data: {
        id: updated.id,
        roleId: updated.roleId,
        roleName: updated.role.name,
        roleCode: updated.role.code,
      },
    };
  }
}
