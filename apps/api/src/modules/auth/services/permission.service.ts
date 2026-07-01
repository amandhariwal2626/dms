import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AuthRepository } from '../repositories/auth.repository';
import type {
  CreatePermissionDto,
  UpdatePermissionDto,
  PermissionStatusChangeDto,
  PermissionQueryDto,
} from '../dto/permission.dto';
import {
  PermissionCreatedEvent,
  PermissionUpdatedEvent,
  PermissionStatusChangedEvent,
  PermissionDeletedEvent,
} from '../events/permission.events';
import {
  DuplicatePermissionCodeException,
  DuplicatePermissionNameException,
  PermissionNotFoundException,
  ModuleNotFoundException,
  SystemPermissionModificationException,
  PermissionInUseException,
  CannotArchiveSystemPermissionException,
} from '../exceptions/permission.exceptions';
import type { Prisma } from '@prisma/client';

export interface PermissionPaginatedResponse<T> {
  success: true;
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface PermissionListResponse {
  success: true;
  data: Array<{
    id: string;
    module: string;
    subModule: string | null;
    name: string;
    code: string;
    displayName: string | null;
    description: string | null;
    action: string;
    permissionType: string;
    resourceType: string | null;
    status: string;
    isSystemPermission: boolean;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  }>;
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface PermissionDetailResponse {
  success: true;
  data: {
    id: string;
    module: string;
    subModule: string | null;
    feature: string | null;
    screen: string | null;
    name: string;
    code: string;
    displayName: string | null;
    description: string | null;
    action: string;
    permissionType: string;
    resourceType: string | null;
    resourceName: string | null;
    apiEndpoint: string | null;
    httpMethod: string | null;
    frontendRoute: string | null;
    menuKey: string | null;
    icon: string | null;
    displayOrder: number | null;
    showInMenu: boolean;
    showInSidebar: boolean;
    isSystemPermission: boolean;
    isEditable: boolean;
    isDeprecated: boolean;
    status: string;
    isActive: boolean;
    metadata: Record<string, unknown> | null;
    createdAt: string;
    updatedAt: string;
    createdBy: string | null;
    updatedBy: string | null;
  };
}

export interface PermissionModuleListResponse {
  success: true;
  data: Array<{
    id: string;
    name: string;
    code: string;
    displayName: string | null;
    description: string | null;
    action: string;
    permissionType: string;
    feature: string | null;
    displayOrder: number | null;
  }>;
}

export interface PermissionActionResponse {
  success: true;
  message: string;
  data?: Record<string, unknown>;
}

@Injectable()
export class PermissionService {
  private readonly logger = new Logger(PermissionService.name);

  constructor(
    private readonly authRepository: AuthRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async list(query: PermissionQueryDto): Promise<PermissionListResponse> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: Prisma.PermissionWhereInput = {
      isDeleted: false,
    };

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { code: { contains: query.search, mode: 'insensitive' } },
        { displayName: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { module: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.module) {
      where.module = query.module;
    }

    if (query.subModule) {
      where.subModule = query.subModule;
    }

    if (query.action) {
      where.action = query.action;
    }

    if (query.permissionType) {
      where.permissionType = query.permissionType;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.isSystemPermission !== undefined) {
      where.isSystemPermission = query.isSystemPermission;
    }

    const sortBy = query.sortBy ?? 'createdAt';
    const sortOrder = query.sortOrder ?? 'desc';
    const orderBy: Prisma.PermissionOrderByWithRelationInput = { [sortBy]: sortOrder };

    const [permissions, total] = await Promise.all([
      this.authRepository.findPermissions({ where, skip, take: limit, orderBy }),
      this.authRepository.countPermissions(where),
    ]);

    return {
      success: true,
      data: permissions.map((p) => ({
        id: p.id,
        module: p.module,
        subModule: p.subModule,
        name: p.name,
        code: p.code,
        displayName: p.displayName,
        description: p.description,
        action: p.action,
        permissionType: p.permissionType,
        resourceType: p.resourceType,
        status: p.status,
        isSystemPermission: p.isSystemPermission,
        isActive: p.isActive,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      })),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getById(id: string): Promise<PermissionDetailResponse> {
    const permission = await this.authRepository.findPermissionById(id);

    if (!permission) {
      throw new PermissionNotFoundException();
    }

    return {
      success: true,
      data: {
        id: permission.id,
        module: permission.module,
        subModule: permission.subModule,
        feature: permission.feature,
        screen: permission.screen,
        name: permission.name,
        code: permission.code,
        displayName: permission.displayName,
        description: permission.description,
        action: permission.action,
        permissionType: permission.permissionType,
        resourceType: permission.resourceType,
        resourceName: permission.resourceName,
        apiEndpoint: permission.apiEndpoint,
        httpMethod: permission.httpMethod,
        frontendRoute: permission.frontendRoute,
        menuKey: permission.menuKey,
        icon: permission.icon,
        displayOrder: permission.displayOrder,
        showInMenu: permission.showInMenu,
        showInSidebar: permission.showInSidebar,
        isSystemPermission: permission.isSystemPermission,
        isEditable: permission.isEditable,
        isDeprecated: permission.isDeprecated,
        status: permission.status,
        isActive: permission.isActive,
        metadata: permission.metadata as Record<string, unknown> | null,
        createdAt: permission.createdAt.toISOString(),
        updatedAt: permission.updatedAt.toISOString(),
        createdBy: permission.createdBy,
        updatedBy: permission.updatedBy,
      },
    };
  }

  async create(userId: string, dto: CreatePermissionDto): Promise<PermissionActionResponse> {
    this.logger.log(`Creating permission '${dto.name}'`);

    const module = await this.authRepository.findModuleById(dto.moduleId);
    if (!module) {
      throw new ModuleNotFoundException();
    }

    const existingCode = await this.authRepository.findPermissionByCode(dto.code);
    if (existingCode) {
      throw new DuplicatePermissionCodeException();
    }

    const existingName = await this.authRepository.findPermissionByName(dto.name);
    if (existingName) {
      throw new DuplicatePermissionNameException();
    }

    const permission = await this.authRepository.createPermission({
      module: module.name,
      subModule: null,
      name: dto.name,
      code: dto.code,
      displayName: dto.displayName ?? null,
      description: dto.description ?? null,
      action: dto.action,
      permissionType: dto.permissionType ?? 'FEATURE',
      resourceType: dto.resourceType ?? null,
      apiEndpoint: dto.apiEndpoint ?? null,
      httpMethod: dto.httpMethod ?? null,
      frontendRoute: dto.frontendRoute ?? null,
      menuKey: dto.menuKey ?? null,
      displayOrder: dto.displayOrder ?? null,
      createdBy: userId,
      updatedBy: userId,
    });

    this.eventEmitter.emit(
      PermissionCreatedEvent.eventName,
      new PermissionCreatedEvent(permission.id, userId),
    );

    await this.authRepository.createActivityLog({
      user: { connect: { id: userId } },
      title: 'Permission Created',
      description: `Permission '${permission.name}' (${permission.code}) created`,
      activityType: 'DATA_CREATE',
      module: 'AUTH',
      entityName: 'Permission',
      entityId: permission.id,
      performedAt: new Date(),
    });

    this.logger.log(`Permission '${permission.name}' created`);

    return {
      success: true,
      message: 'Permission created successfully',
      data: { id: permission.id },
    };
  }

  async update(
    id: string,
    userId: string,
    dto: UpdatePermissionDto,
  ): Promise<PermissionActionResponse> {
    this.logger.log(`Updating permission ${id}`);

    const permission = await this.authRepository.findPermissionById(id);
    if (!permission) {
      throw new PermissionNotFoundException();
    }

    if (permission.isSystemPermission) {
      throw new SystemPermissionModificationException();
    }

    const updateData: Prisma.PermissionUpdateInput = {
      updatedBy: userId,
    };

    if (dto.displayName !== undefined) {
      updateData.displayName = dto.displayName;
    }
    if (dto.description !== undefined) {
      updateData.description = dto.description;
    }
    if (dto.apiEndpoint !== undefined) {
      updateData.apiEndpoint = dto.apiEndpoint;
    }
    if (dto.httpMethod !== undefined) {
      updateData.httpMethod = dto.httpMethod;
    }
    if (dto.frontendRoute !== undefined) {
      updateData.frontendRoute = dto.frontendRoute;
    }
    if (dto.menuKey !== undefined) {
      updateData.menuKey = dto.menuKey;
    }
    if (dto.displayOrder !== undefined) {
      updateData.displayOrder = dto.displayOrder;
    }

    const updated = await this.authRepository.updatePermission(id, updateData);

    this.eventEmitter.emit(
      PermissionUpdatedEvent.eventName,
      new PermissionUpdatedEvent(id, userId),
    );

    await this.authRepository.createActivityLog({
      user: { connect: { id: userId } },
      title: 'Permission Updated',
      description: `Permission '${updated.name}' (${updated.code}) updated`,
      activityType: 'DATA_UPDATE',
      module: 'AUTH',
      entityName: 'Permission',
      entityId: id,
      performedAt: new Date(),
    });

    this.logger.log(`Permission ${id} updated`);

    return { success: true, message: 'Permission updated successfully' };
  }

  async changeStatus(
    id: string,
    userId: string,
    dto: PermissionStatusChangeDto,
  ): Promise<PermissionActionResponse> {
    this.logger.log(`Changing status of permission ${id} to ${dto.status}`);

    const permission = await this.authRepository.findPermissionById(id);
    if (!permission) {
      throw new PermissionNotFoundException();
    }

    if (dto.status === 'ARCHIVED' && permission.isSystemPermission) {
      throw new CannotArchiveSystemPermissionException();
    }

    const updateData: Prisma.PermissionUpdateInput = {
      updatedBy: userId,
    };

    if (dto.status === 'ACTIVE') {
      updateData.status = 'ACTIVE';
      updateData.isActive = true;
      updateData.isDeprecated = false;
    } else if (dto.status === 'INACTIVE') {
      updateData.status = 'INACTIVE';
      updateData.isActive = false;
      updateData.isDeprecated = false;
    } else if (dto.status === 'ARCHIVED') {
      updateData.status = 'INACTIVE';
      updateData.isActive = false;
      updateData.isDeprecated = true;
    }

    const updated = await this.authRepository.updatePermission(id, updateData);

    this.eventEmitter.emit(
      PermissionStatusChangedEvent.eventName,
      new PermissionStatusChangedEvent(id, dto.status, userId),
    );

    let activityTitle = 'Permission Status Changed';
    if (dto.status === 'ACTIVE') activityTitle = 'Permission Activated';
    if (dto.status === 'INACTIVE') activityTitle = 'Permission Deactivated';
    if (dto.status === 'ARCHIVED') activityTitle = 'Permission Archived';

    await this.authRepository.createActivityLog({
      user: { connect: { id: userId } },
      title: activityTitle,
      description: `Permission '${updated.name}' (${updated.code}) status changed to ${dto.status}`,
      activityType: 'STATUS_CHANGE',
      module: 'AUTH',
      entityName: 'Permission',
      entityId: id,
      performedAt: new Date(),
    });

    this.logger.log(`Permission ${id} status changed to ${dto.status}`);

    return { success: true, message: `Permission ${dto.status.toLowerCase()} successfully` };
  }

  async delete(id: string, userId: string): Promise<PermissionActionResponse> {
    this.logger.log(`Deleting permission ${id}`);

    const permission = await this.authRepository.findPermissionById(id);
    if (!permission) {
      throw new PermissionNotFoundException();
    }

    if (permission.isSystemPermission) {
      throw new SystemPermissionModificationException();
    }

    const assignmentCount = await this.authRepository.countPermissionRoleAssignments(id);
    if (assignmentCount > 0) {
      throw new PermissionInUseException();
    }

    await this.authRepository.softDeletePermission(id, userId);

    this.eventEmitter.emit(
      PermissionDeletedEvent.eventName,
      new PermissionDeletedEvent(id, userId),
    );

    await this.authRepository.createActivityLog({
      user: { connect: { id: userId } },
      title: 'Permission Deleted',
      description: `Permission '${permission.name}' (${permission.code}) deleted`,
      activityType: 'DATA_DELETE',
      module: 'AUTH',
      entityName: 'Permission',
      entityId: id,
      performedAt: new Date(),
    });

    this.logger.log(`Permission ${id} deleted`);

    return { success: true, message: 'Permission deleted successfully' };
  }

  async listByModule(moduleId: string): Promise<PermissionModuleListResponse> {
    const module = await this.authRepository.findModuleById(moduleId);
    if (!module) {
      throw new ModuleNotFoundException();
    }

    const permissions = await this.authRepository.findPermissionsByModule(module.name);

    return {
      success: true,
      data: permissions.map((p) => ({
        id: p.id,
        name: p.name,
        code: p.code,
        displayName: p.displayName,
        description: p.description,
        action: p.action,
        permissionType: p.permissionType,
        feature: p.feature,
        displayOrder: p.displayOrder,
      })),
    };
  }
}
