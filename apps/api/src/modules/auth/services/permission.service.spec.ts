import { Test, type TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import type { Permission, Module } from '@prisma/client';
import { PermissionService } from './permission.service';
import { AuthRepository } from '../repositories/auth.repository';
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
import type {
  CreatePermissionDto,
  UpdatePermissionDto,
  PermissionQueryDto,
} from '../dto/permission.dto';

describe('PermissionService', () => {
  let service: PermissionService;
  let authRepository: jest.Mocked<AuthRepository>;
  let eventEmitter: jest.Mocked<EventEmitter2>;

  const mockPermission: Permission = {
    id: 'perm-id-1',
    module: 'Products',
    subModule: null,
    feature: null,
    screen: null,
    name: 'Create Product',
    code: 'PRODUCT_CREATE',
    displayName: 'Create Product',
    description: 'Allows creating new products',
    action: 'CREATE',
    permissionType: 'ACTION',
    resourceType: 'Product',
    resourceName: null,
    apiEndpoint: '/api/products',
    httpMethod: 'POST',
    frontendRoute: '/products/create',
    menuKey: 'products.create',
    icon: null,
    displayOrder: 1,
    showInMenu: true,
    showInSidebar: true,
    showInMobile: true,
    isHidden: false,
    isSystemPermission: false,
    isEditable: true,
    isDeprecated: false,
    status: 'ACTIVE',
    isActive: true,
    metadata: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    createdBy: 'user-1',
    updatedBy: 'user-1',
    deletedAt: null,
    deletedBy: null,
    isDeleted: false,
    version: 1,
  };

  const mockSystemPermission: Permission = {
    ...mockPermission,
    id: 'system-perm-id',
    name: 'System Permission',
    code: 'SYSTEM_PERM',
    isSystemPermission: true,
    isEditable: false,
  };

  const mockModule: Module = {
    id: 'module-id-1',
    name: 'Products',
    code: 'PRODUCTS',
    displayName: 'Product Master',
    description: 'Product management module',
    parentModuleId: null,
    level: 0,
    displayOrder: 1,
    route: '/products',
    icon: 'package',
    menuKey: 'products',
    badge: null,
    showInSidebar: true,
    showInNavbar: true,
    showInMobile: true,
    showInSettings: true,
    isCoreModule: false,
    isSystemModule: false,
    isLicensable: false,
    isEnabledByDefault: true,
    requiresSubscription: false,
    subscriptionFeatureKey: null,
    color: null,
    category: 'MASTER',
    groupName: null,
    status: 'ACTIVE',
    isActive: true,
    metadata: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    createdBy: null,
    updatedBy: null,
    deletedAt: null,
    deletedBy: null,
    isDeleted: false,
    version: 1,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionService,
        {
          provide: AuthRepository,
          useValue: {
            findPermissions: jest.fn(),
            countPermissions: jest.fn(),
            findPermissionById: jest.fn(),
            findPermissionByCode: jest.fn(),
            findPermissionByName: jest.fn(),
            findModuleById: jest.fn(),
            createPermission: jest.fn(),
            updatePermission: jest.fn(),
            softDeletePermission: jest.fn(),
            countPermissionRoleAssignments: jest.fn(),
            findPermissionsByModule: jest.fn(),
            createActivityLog: jest.fn(),
          },
        },
        {
          provide: EventEmitter2,
          useValue: { emit: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<PermissionService>(PermissionService);
    authRepository = module.get(AuthRepository);
    eventEmitter = module.get(EventEmitter2);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ─── List Permissions ────────────────────────

  describe('list', () => {
    const query: PermissionQueryDto = {
      page: 1,
      limit: 10,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    };

    it('should return paginated permissions', async () => {
      authRepository.findPermissions.mockResolvedValue([mockPermission]);
      authRepository.countPermissions.mockResolvedValue(1);

      const result = await service.list(query);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });

    it('should apply search filter', async () => {
      authRepository.findPermissions.mockResolvedValue([mockPermission]);
      authRepository.countPermissions.mockResolvedValue(1);

      await service.list(Object.assign({}, query, { search: 'Product' }));

      expect(authRepository.findPermissions).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ name: expect.objectContaining({ contains: 'Product' }) }),
            ]),
          }),
        }),
      );
    });

    it('should apply module filter', async () => {
      authRepository.findPermissions.mockResolvedValue([mockPermission]);
      authRepository.countPermissions.mockResolvedValue(1);

      await service.list(Object.assign({}, query, { module: 'Products' }));

      expect(authRepository.findPermissions).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ module: 'Products' }),
        }),
      );
    });

    it('should apply action filter', async () => {
      authRepository.findPermissions.mockResolvedValue([mockPermission]);
      authRepository.countPermissions.mockResolvedValue(1);

      await service.list(Object.assign({}, query, { action: 'CREATE' }));

      expect(authRepository.findPermissions).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ action: 'CREATE' }),
        }),
      );
    });

    it('should return empty array when no permissions', async () => {
      authRepository.findPermissions.mockResolvedValue([]);
      authRepository.countPermissions.mockResolvedValue(0);

      const result = await service.list(query);

      expect(result.data).toHaveLength(0);
      expect(result.meta.total).toBe(0);
    });
  });

  // ─── Get Permission By ID ────────────────────

  describe('getById', () => {
    it('should return complete permission details', async () => {
      authRepository.findPermissionById.mockResolvedValue(mockPermission);

      const result = await service.getById('perm-id-1');

      expect(result.success).toBe(true);
      expect(result.data.id).toBe('perm-id-1');
      expect(result.data.name).toBe('Create Product');
      expect(result.data.module).toBe('Products');
      expect(result.data.action).toBe('CREATE');
      expect(result.data.apiEndpoint).toBe('/api/products');
      expect(result.data.httpMethod).toBe('POST');
    });

    it('should throw PermissionNotFoundException when not found', async () => {
      authRepository.findPermissionById.mockResolvedValue(null);

      await expect(service.getById('bad-id')).rejects.toThrow(PermissionNotFoundException);
    });
  });

  // ─── Create Permission ───────────────────────

  describe('create', () => {
    const createDto: CreatePermissionDto = {
      moduleId: 'module-id-1',
      name: 'View Product',
      code: 'PRODUCT_VIEW',
      displayName: 'View Product',
      description: 'Allows viewing products',
      action: 'VIEW',
      permissionType: 'ACTION',
      resourceType: 'Product',
      apiEndpoint: '/api/products',
      httpMethod: 'GET',
      frontendRoute: '/products',
      menuKey: 'products.view',
      displayOrder: 2,
    };

    it('should create a permission', async () => {
      authRepository.findModuleById.mockResolvedValue(mockModule);
      authRepository.findPermissionByCode.mockResolvedValue(null);
      authRepository.findPermissionByName.mockResolvedValue(null);
      authRepository.createPermission.mockResolvedValue({
        ...mockPermission,
        id: 'new-perm-id',
        name: 'View Product',
        code: 'PRODUCT_VIEW',
      });
      authRepository.createActivityLog.mockResolvedValue({} as never);

      const result = await service.create('user-1', createDto);

      expect(result.success).toBe(true);
      expect(authRepository.createPermission).toHaveBeenCalledWith(
        expect.objectContaining({
          module: 'Products',
          name: 'View Product',
          code: 'PRODUCT_VIEW',
          action: 'VIEW',
        }),
      );
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'permission.created',
        expect.any(PermissionCreatedEvent),
      );
    });

    it('should throw ModuleNotFoundException when module not found', async () => {
      authRepository.findModuleById.mockResolvedValue(null);

      await expect(service.create('user-1', createDto)).rejects.toThrow(ModuleNotFoundException);
    });

    it('should throw DuplicatePermissionCodeException when code exists', async () => {
      authRepository.findModuleById.mockResolvedValue(mockModule);
      authRepository.findPermissionByCode.mockResolvedValue(mockPermission);

      await expect(service.create('user-1', createDto)).rejects.toThrow(
        DuplicatePermissionCodeException,
      );
    });

    it('should throw DuplicatePermissionNameException when name exists', async () => {
      authRepository.findModuleById.mockResolvedValue(mockModule);
      authRepository.findPermissionByCode.mockResolvedValue(null);
      authRepository.findPermissionByName.mockResolvedValue(mockPermission);

      await expect(service.create('user-1', createDto)).rejects.toThrow(
        DuplicatePermissionNameException,
      );
    });

    it('should log activity on creation', async () => {
      authRepository.findModuleById.mockResolvedValue(mockModule);
      authRepository.findPermissionByCode.mockResolvedValue(null);
      authRepository.findPermissionByName.mockResolvedValue(null);
      authRepository.createPermission.mockResolvedValue({
        ...mockPermission,
        id: 'new-perm-id',
        name: 'View Product',
        code: 'PRODUCT_VIEW',
      });
      authRepository.createActivityLog.mockResolvedValue({} as never);

      await service.create('user-1', createDto);

      expect(authRepository.createActivityLog).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Permission Created',
          activityType: 'DATA_CREATE',
        }),
      );
    });
  });

  // ─── Update Permission ───────────────────────

  describe('update', () => {
    const updateDto: UpdatePermissionDto = {
      displayName: 'Updated Display',
      description: 'Updated description',
      frontendRoute: '/products/updated',
    };

    it('should update allowed fields', async () => {
      authRepository.findPermissionById.mockResolvedValue(mockPermission);
      authRepository.updatePermission.mockResolvedValue({
        ...mockPermission,
        displayName: 'Updated Display',
      });
      authRepository.createActivityLog.mockResolvedValue({} as never);

      const result = await service.update('perm-id-1', 'user-1', updateDto);

      expect(result.success).toBe(true);
      expect(authRepository.updatePermission).toHaveBeenCalledWith(
        'perm-id-1',
        expect.objectContaining({
          displayName: 'Updated Display',
        }),
      );
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'permission.updated',
        expect.any(PermissionUpdatedEvent),
      );
    });

    it('should throw PermissionNotFoundException when not found', async () => {
      authRepository.findPermissionById.mockResolvedValue(null);

      await expect(service.update('bad-id', 'user-1', updateDto)).rejects.toThrow(
        PermissionNotFoundException,
      );
    });

    it('should throw SystemPermissionModificationException for system permissions', async () => {
      authRepository.findPermissionById.mockResolvedValue(mockSystemPermission);

      await expect(service.update('system-perm-id', 'user-1', updateDto)).rejects.toThrow(
        SystemPermissionModificationException,
      );
    });
  });

  // ─── Change Status ───────────────────────────

  describe('changeStatus', () => {
    it('should activate a permission', async () => {
      authRepository.findPermissionById.mockResolvedValue({
        ...mockPermission,
        status: 'INACTIVE',
        isActive: false,
      });
      authRepository.updatePermission.mockResolvedValue({
        ...mockPermission,
        status: 'ACTIVE',
        isActive: true,
      });
      authRepository.createActivityLog.mockResolvedValue({} as never);

      const result = await service.changeStatus('perm-id-1', 'user-1', { status: 'ACTIVE' });

      expect(result.success).toBe(true);
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'permission.status.changed',
        expect.any(PermissionStatusChangedEvent),
      );
    });

    it('should deactivate a permission', async () => {
      authRepository.findPermissionById.mockResolvedValue(mockPermission);
      authRepository.updatePermission.mockResolvedValue({
        ...mockPermission,
        status: 'INACTIVE',
        isActive: false,
      });
      authRepository.createActivityLog.mockResolvedValue({} as never);

      const result = await service.changeStatus('perm-id-1', 'user-1', { status: 'INACTIVE' });

      expect(result.success).toBe(true);
      expect(authRepository.createActivityLog).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Permission Deactivated' }),
      );
    });

    it('should archive a permission', async () => {
      authRepository.findPermissionById.mockResolvedValue(mockPermission);
      authRepository.updatePermission.mockResolvedValue({
        ...mockPermission,
        status: 'INACTIVE',
        isActive: false,
        isDeprecated: true,
      });
      authRepository.createActivityLog.mockResolvedValue({} as never);

      const result = await service.changeStatus('perm-id-1', 'user-1', { status: 'ARCHIVED' });

      expect(result.success).toBe(true);
      expect(authRepository.createActivityLog).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Permission Archived' }),
      );
    });

    it('should throw PermissionNotFoundException when not found', async () => {
      authRepository.findPermissionById.mockResolvedValue(null);

      await expect(service.changeStatus('bad-id', 'user-1', { status: 'ACTIVE' })).rejects.toThrow(
        PermissionNotFoundException,
      );
    });

    it('should throw CannotArchiveSystemPermissionException for system permissions', async () => {
      authRepository.findPermissionById.mockResolvedValue(mockSystemPermission);

      await expect(
        service.changeStatus('system-perm-id', 'user-1', { status: 'ARCHIVED' }),
      ).rejects.toThrow(CannotArchiveSystemPermissionException);
    });
  });

  // ─── Delete Permission ───────────────────────

  describe('delete', () => {
    it('should soft delete a permission', async () => {
      authRepository.findPermissionById.mockResolvedValue(mockPermission);
      authRepository.countPermissionRoleAssignments.mockResolvedValue(0);
      authRepository.softDeletePermission.mockResolvedValue({ ...mockPermission, isDeleted: true });
      authRepository.createActivityLog.mockResolvedValue({} as never);

      const result = await service.delete('perm-id-1', 'user-1');

      expect(result.success).toBe(true);
      expect(authRepository.softDeletePermission).toHaveBeenCalledWith('perm-id-1', 'user-1');
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'permission.deleted',
        expect.any(PermissionDeletedEvent),
      );
    });

    it('should throw PermissionNotFoundException when not found', async () => {
      authRepository.findPermissionById.mockResolvedValue(null);

      await expect(service.delete('bad-id', 'user-1')).rejects.toThrow(PermissionNotFoundException);
    });

    it('should throw SystemPermissionModificationException for system permissions', async () => {
      authRepository.findPermissionById.mockResolvedValue(mockSystemPermission);

      await expect(service.delete('system-perm-id', 'user-1')).rejects.toThrow(
        SystemPermissionModificationException,
      );
    });

    it('should throw PermissionInUseException when assigned to roles', async () => {
      authRepository.findPermissionById.mockResolvedValue(mockPermission);
      authRepository.countPermissionRoleAssignments.mockResolvedValue(2);

      await expect(service.delete('perm-id-1', 'user-1')).rejects.toThrow(PermissionInUseException);
    });

    it('should log activity on deletion', async () => {
      authRepository.findPermissionById.mockResolvedValue(mockPermission);
      authRepository.countPermissionRoleAssignments.mockResolvedValue(0);
      authRepository.softDeletePermission.mockResolvedValue({ ...mockPermission, isDeleted: true });
      authRepository.createActivityLog.mockResolvedValue({} as never);

      await service.delete('perm-id-1', 'user-1');

      expect(authRepository.createActivityLog).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Permission Deleted',
          activityType: 'DATA_DELETE',
        }),
      );
    });
  });

  // ─── List By Module ──────────────────────────

  describe('listByModule', () => {
    it('should return permissions grouped by module', async () => {
      authRepository.findModuleById.mockResolvedValue(mockModule);
      authRepository.findPermissionsByModule.mockResolvedValue([mockPermission]);

      const result = await service.listByModule('module-id-1');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0]?.name).toBe('Create Product');
    });

    it('should throw ModuleNotFoundException when module not found', async () => {
      authRepository.findModuleById.mockResolvedValue(null);

      await expect(service.listByModule('bad-module-id')).rejects.toThrow(ModuleNotFoundException);
    });

    it('should filter permissions by module name', async () => {
      authRepository.findModuleById.mockResolvedValue(mockModule);
      authRepository.findPermissionsByModule.mockResolvedValue([mockPermission]);

      await service.listByModule('module-id-1');

      expect(authRepository.findPermissionsByModule).toHaveBeenCalledWith('Products');
    });
  });
});
