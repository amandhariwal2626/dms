import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AuthRepository } from '../repositories/auth.repository';
import type { CreateRoleDto, UpdateRoleDto, StatusChangeDto, RoleQueryDto } from '../dto/role.dto';
import {
  RoleCreatedEvent,
  RoleUpdatedEvent,
  RoleStatusChangedEvent,
  RoleClonedEvent,
  RoleDeletedEvent,
} from '../events/role.events';
import {
  DuplicateRoleNameException,
  DuplicateRoleCodeException,
  RoleNotFoundException,
  InvalidParentRoleException,
  SystemRoleModificationException,
  RoleInUseException,
  CannotDeleteAdminRoleException,
  CannotArchiveSystemRoleException,
  CannotDeactivateAdminRoleException,
} from '../exceptions/role.exceptions';
import { COMPANY_ADMIN_ROLE_CODE } from '../constants/role.constants';
import type { Prisma } from '@prisma/client';

export interface PaginatedResponse<T> {
  success: true;
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface RoleListResponse {
  success: true;
  data: Array<{
    id: string;
    name: string;
    code: string;
    displayName: string | null;
    description: string | null;
    roleType: string;
    parentRoleId: string | null;
    isSystemRole: boolean;
    isEditable: boolean;
    isDeletable: boolean;
    status: string;
    isActive: boolean;
    hierarchyLevel: number;
    priority: number;
    userCount: number;
    createdAt: string;
    updatedAt: string;
    createdBy: string | null;
    updatedBy: string | null;
  }>;
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface RoleDetailResponse {
  success: true;
  data: {
    id: string;
    companyId: string;
    name: string;
    code: string;
    displayName: string | null;
    description: string | null;
    roleType: string;
    parentRoleId: string | null;
    parentRole: { id: string; name: string; code: string; displayName: string | null } | null;
    childRolesCount: number;
    isSystemRole: boolean;
    isEditable: boolean;
    isDeletable: boolean;
    isAssignable: boolean;
    defaultLandingPage: string | null;
    defaultModule: string | null;
    status: string;
    isActive: boolean;
    userCount: number;
    hierarchyLevel: number;
    priority: number;
    createdAt: string;
    updatedAt: string;
    createdBy: string | null;
    updatedBy: string | null;
  };
}

export interface ActionResponse {
  success: true;
  message: string;
  data?: Record<string, unknown>;
}

@Injectable()
export class RoleService {
  private readonly logger = new Logger(RoleService.name);

  constructor(
    private readonly authRepository: AuthRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async list(companyId: string, query: RoleQueryDto): Promise<RoleListResponse> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: Prisma.RoleWhereInput = {
      companyId,
      isDeleted: false,
    };

    if (query.search) {
      const search = query.search;
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { displayName: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.roleType) {
      where.roleType = query.roleType;
    }

    if (query.isSystemRole !== undefined) {
      where.isSystemRole = query.isSystemRole;
    }

    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    const sortBy = query.sortBy ?? 'createdAt';
    const sortOrder = query.sortOrder ?? 'desc';
    const orderBy: Prisma.RoleOrderByWithRelationInput = { [sortBy]: sortOrder };

    const [roles, total] = await Promise.all([
      this.authRepository.findRoles({
        where,
        skip,
        take: limit,
        orderBy,
      }),
      this.authRepository.countRoles(where),
    ]);

    const data = roles.map((role) => ({
      id: role.id,
      name: role.name,
      code: role.code,
      displayName: role.displayName,
      description: role.description,
      roleType: role.roleType,
      parentRoleId: role.parentRoleId,
      isSystemRole: role.isSystemRole,
      isEditable: role.isEditable,
      isDeletable: role.isDeletable,
      status: role.status,
      isActive: role.isActive,
      hierarchyLevel: role.hierarchyLevel,
      priority: role.priority,
      userCount: 0,
      createdAt: role.createdAt.toISOString(),
      updatedAt: role.updatedAt.toISOString(),
      createdBy: role.createdBy,
      updatedBy: role.updatedBy,
    }));

    return {
      success: true,
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getById(id: string, companyId: string): Promise<RoleDetailResponse> {
    const role = await this.authRepository.findRoleWithDetails(id);

    if (!role || role.companyId !== companyId) {
      throw new RoleNotFoundException();
    }

    const userCount = await this.authRepository.countActiveRoleUsers(id);

    return {
      success: true,
      data: {
        id: role.id,
        companyId: role.companyId,
        name: role.name,
        code: role.code,
        displayName: role.displayName,
        description: role.description,
        roleType: role.roleType,
        parentRoleId: role.parentRoleId,
        parentRole: role.parentRole,
        childRolesCount: role.childRoles?.length ?? 0,
        isSystemRole: role.isSystemRole,
        isEditable: role.isEditable,
        isDeletable: role.isDeletable,
        isAssignable: role.isAssignable,
        defaultLandingPage: role.defaultLandingPage,
        defaultModule: role.defaultModule,
        status: role.status,
        isActive: role.isActive,
        userCount,
        hierarchyLevel: role.hierarchyLevel,
        priority: role.priority,
        createdAt: role.createdAt.toISOString(),
        updatedAt: role.updatedAt.toISOString(),
        createdBy: role.createdBy,
        updatedBy: role.updatedBy,
      },
    };
  }

  async create(companyId: string, userId: string, dto: CreateRoleDto): Promise<ActionResponse> {
    this.logger.log(`Creating role '${dto.name}' in company ${companyId}`);

    const existingName = await this.authRepository.findRoleByName(companyId, dto.name);
    if (existingName) {
      throw new DuplicateRoleNameException();
    }

    const existingCode = await this.authRepository.findRoleByCode(companyId, dto.code);
    if (existingCode) {
      throw new DuplicateRoleCodeException();
    }

    if (dto.parentRoleId) {
      const parentRole = await this.authRepository.findRoleById(dto.parentRoleId);
      if (!parentRole || parentRole.companyId !== companyId) {
        throw new InvalidParentRoleException();
      }
    }

    const role = await this.authRepository.createRole({
      company: { connect: { id: companyId } },
      name: dto.name,
      code: dto.code,
      displayName: dto.displayName ?? null,
      description: dto.description ?? null,
      roleType: 'CUSTOM',
      isSystemRole: false,
      isEditable: true,
      isDeletable: true,
      isAssignable: true,
      hierarchyLevel: 1,
      priority: 1,
      defaultLandingPage: dto.defaultLandingPage ?? null,
      defaultModule: dto.defaultModule ?? null,
      createdBy: userId,
      updatedBy: userId,
    });

    this.eventEmitter.emit(
      RoleCreatedEvent.eventName,
      new RoleCreatedEvent(role.id, companyId, userId),
    );

    await this.authRepository.createActivityLog({
      company: { connect: { id: companyId } },
      user: { connect: { id: userId } },
      title: 'Role Created',
      description: `Role '${role.name}' (${role.code}) created`,
      activityType: 'DATA_CREATE',
      module: 'AUTH',
      entityName: 'Role',
      entityId: role.id,
      performedAt: new Date(),
    });

    this.logger.log(`Role '${role.name}' created successfully`);

    return {
      success: true,
      message: 'Role created successfully',
      data: { id: role.id },
    };
  }

  async update(
    id: string,
    companyId: string,
    userId: string,
    dto: UpdateRoleDto,
  ): Promise<ActionResponse> {
    this.logger.log(`Updating role ${id}`);

    const role = await this.authRepository.findRoleById(id);
    if (!role || role.companyId !== companyId) {
      throw new RoleNotFoundException();
    }

    if (role.isSystemRole) {
      throw new SystemRoleModificationException();
    }

    if (dto.parentRoleId) {
      const parentRole = await this.authRepository.findRoleById(dto.parentRoleId);
      if (!parentRole || parentRole.companyId !== companyId) {
        throw new InvalidParentRoleException();
      }
    }

    const updateData: Prisma.RoleUpdateInput = {
      updatedBy: userId,
    };

    if (dto.displayName !== undefined) {
      updateData.displayName = dto.displayName;
    }
    if (dto.description !== undefined) {
      updateData.description = dto.description;
    }
    if (dto.defaultLandingPage !== undefined) {
      updateData.defaultLandingPage = dto.defaultLandingPage;
    }
    if (dto.defaultModule !== undefined) {
      updateData.defaultModule = dto.defaultModule;
    }
    if (dto.parentRoleId !== undefined) {
      updateData.parentRole = { connect: { id: dto.parentRoleId } };
    }

    const updated = await this.authRepository.updateRole(id, updateData);

    this.eventEmitter.emit(RoleUpdatedEvent.eventName, new RoleUpdatedEvent(id, companyId, userId));

    await this.authRepository.createActivityLog({
      company: { connect: { id: companyId } },
      user: { connect: { id: userId } },
      title: 'Role Updated',
      description: `Role '${updated.name}' (${updated.code}) updated`,
      activityType: 'DATA_UPDATE',
      module: 'AUTH',
      entityName: 'Role',
      entityId: id,
      performedAt: new Date(),
    });

    this.logger.log(`Role ${id} updated successfully`);

    return { success: true, message: 'Role updated successfully' };
  }

  async changeStatus(
    id: string,
    companyId: string,
    userId: string,
    dto: StatusChangeDto,
  ): Promise<ActionResponse> {
    this.logger.log(`Changing status of role ${id} to ${dto.status}`);

    const role = await this.authRepository.findRoleById(id);
    if (!role || role.companyId !== companyId) {
      throw new RoleNotFoundException();
    }

    if (dto.status === 'ARCHIVED' && role.isSystemRole) {
      throw new CannotArchiveSystemRoleException();
    }

    if (dto.status === 'INACTIVE' && role.code === COMPANY_ADMIN_ROLE_CODE) {
      const otherActiveAdmins = await this.authRepository.countActiveAdminRoles(companyId, id);
      if (otherActiveAdmins === 0) {
        throw new CannotDeactivateAdminRoleException();
      }
    }

    const isActive = dto.status === 'ACTIVE';

    const updated = await this.authRepository.updateRole(id, {
      status: dto.status,
      isActive,
      updatedBy: userId,
    });

    this.eventEmitter.emit(
      RoleStatusChangedEvent.eventName,
      new RoleStatusChangedEvent(id, companyId, dto.status, userId),
    );

    let activityTitle = 'Role Status Changed';
    if (dto.status === 'ACTIVE') activityTitle = 'Role Activated';
    if (dto.status === 'INACTIVE') activityTitle = 'Role Deactivated';
    if (dto.status === 'ARCHIVED') activityTitle = 'Role Archived';

    await this.authRepository.createActivityLog({
      company: { connect: { id: companyId } },
      user: { connect: { id: userId } },
      title: activityTitle,
      description: `Role '${updated.name}' (${updated.code}) status changed to ${dto.status}`,
      activityType: 'STATUS_CHANGE',
      module: 'AUTH',
      entityName: 'Role',
      entityId: id,
      performedAt: new Date(),
    });

    this.logger.log(`Role ${id} status changed to ${dto.status}`);

    return { success: true, message: `Role ${dto.status.toLowerCase()} successfully` };
  }

  async clone(id: string, companyId: string, userId: string): Promise<ActionResponse> {
    this.logger.log(`Cloning role ${id}`);

    const sourceRole = await this.authRepository.findRoleById(id);
    if (!sourceRole || sourceRole.companyId !== companyId) {
      throw new RoleNotFoundException();
    }

    const cloneName = `${sourceRole.name} Copy`;
    const cloneCode = `${sourceRole.code}_COPY`;

    const newRole = await this.authRepository.createRole({
      company: { connect: { id: companyId } },
      name: cloneName,
      code: cloneCode,
      displayName: sourceRole.displayName ? `${sourceRole.displayName} Copy` : null,
      description: sourceRole.description,
      roleType: 'CUSTOM',
      isSystemRole: false,
      isEditable: true,
      isDeletable: true,
      isAssignable: sourceRole.isAssignable,
      hierarchyLevel: sourceRole.hierarchyLevel,
      priority: sourceRole.priority,
      defaultLandingPage: sourceRole.defaultLandingPage,
      defaultModule: sourceRole.defaultModule,
      ...(sourceRole.parentRoleId
        ? { parentRole: { connect: { id: sourceRole.parentRoleId } } }
        : {}),
      createdBy: userId,
      updatedBy: userId,
    });

    this.eventEmitter.emit(
      RoleClonedEvent.eventName,
      new RoleClonedEvent(id, newRole.id, companyId, userId),
    );

    await this.authRepository.createActivityLog({
      company: { connect: { id: companyId } },
      user: { connect: { id: userId } },
      title: 'Role Cloned',
      description: `Role '${sourceRole.name}' cloned to '${newRole.name}'`,
      activityType: 'DATA_CREATE',
      module: 'AUTH',
      entityName: 'Role',
      entityId: newRole.id,
      performedAt: new Date(),
    });

    this.logger.log(`Role ${id} cloned to ${newRole.id}`);

    return {
      success: true,
      message: 'Role cloned successfully',
      data: { id: newRole.id, name: newRole.name, code: newRole.code },
    };
  }

  async delete(id: string, companyId: string, userId: string): Promise<ActionResponse> {
    this.logger.log(`Deleting role ${id}`);

    const role = await this.authRepository.findRoleById(id);
    if (!role || role.companyId !== companyId) {
      throw new RoleNotFoundException();
    }

    if (role.isSystemRole) {
      throw new SystemRoleModificationException();
    }

    if (role.code === COMPANY_ADMIN_ROLE_CODE) {
      throw new CannotDeleteAdminRoleException();
    }

    const activeUserCount = await this.authRepository.countActiveRoleUsers(id);
    if (activeUserCount > 0) {
      throw new RoleInUseException();
    }

    await this.authRepository.softDeleteRole(id, userId);

    this.eventEmitter.emit(RoleDeletedEvent.eventName, new RoleDeletedEvent(id, companyId, userId));

    await this.authRepository.createActivityLog({
      company: { connect: { id: companyId } },
      user: { connect: { id: userId } },
      title: 'Role Deleted',
      description: `Role '${role.name}' (${role.code}) deleted`,
      activityType: 'DATA_DELETE',
      module: 'AUTH',
      entityName: 'Role',
      entityId: id,
      performedAt: new Date(),
    });

    this.logger.log(`Role ${id} deleted successfully`);

    return { success: true, message: 'Role deleted successfully' };
  }
}
