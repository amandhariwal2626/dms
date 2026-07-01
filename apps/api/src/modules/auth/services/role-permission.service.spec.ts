import { Test, type TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import type {
  Role,
  Permission,
  RolePermission as RolePermissionModel,
  Module,
} from '@prisma/client';
import { RolePermissionService } from './role-permission.service';
import { AuthRepository } from '../repositories/auth.repository';
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

function mockTransaction(repo: jest.Mocked<AuthRepository>): void {
  (repo.$transaction as jest.Mock).mockImplementation((fn: (...args: unknown[]) => unknown) =>
    fn({}),
  );
}

describe('RolePermissionService', () => {
  let service: RolePermissionService;
  let authRepository: jest.Mocked<AuthRepository>;
  let eventEmitter: jest.Mocked<EventEmitter2>;

  const mockRole: Role = {
    id: 'role-id-1',
    companyId: 'company-id-1',
    name: 'Sales Manager',
    code: 'SALES_MANAGER',
    displayName: 'Sales Manager',
    description: 'Manages sales operations',
    roleType: 'CUSTOM',
    parentRoleId: null,
    hierarchyLevel: 2,
    priority: 10,
    isSystemRole: false,
    isEditable: true,
    isDeletable: true,
    isAssignable: true,
    defaultLandingPage: '/dashboard',
    defaultModule: 'SALES',
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

  const mockInactiveRole: Role = {
    ...mockRole,
    id: 'inactive-role-id',
    isActive: false,
    status: 'INACTIVE',
  };

  const mockArchivedRole: Role = {
    ...mockRole,
    id: 'archived-role-id',
    isActive: false,
    status: 'ARCHIVED',
  };

  const mockSystemRole: Role = {
    ...mockRole,
    id: 'system-role-id',
    name: 'System Admin',
    code: 'SYSTEM_ADMIN',
    isSystemRole: true,
  };

  const mockPermissions: Permission[] = [
    {
      id: 'perm-1',
      module: 'User Management',
      subModule: null,
      feature: 'User List',
      screen: null,
      name: 'View Users',
      code: 'USER_VIEW',
      displayName: 'View Users',
      description: 'View user list',
      action: 'VIEW',
      permissionType: 'FEATURE',
      resourceType: null,
      resourceName: null,
      apiEndpoint: null,
      httpMethod: null,
      frontendRoute: null,
      menuKey: null,
      icon: null,
      displayOrder: null,
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
      createdBy: null,
      updatedBy: null,
      deletedAt: null,
      deletedBy: null,
      isDeleted: false,
      version: 1,
    },
    {
      id: 'perm-2',
      module: 'User Management',
      subModule: null,
      feature: 'User List',
      screen: null,
      name: 'Create Users',
      code: 'USER_CREATE',
      displayName: 'Create Users',
      description: 'Create new users',
      action: 'CREATE',
      permissionType: 'FEATURE',
      resourceType: null,
      resourceName: null,
      apiEndpoint: null,
      httpMethod: null,
      frontendRoute: null,
      menuKey: null,
      icon: null,
      displayOrder: null,
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
      createdBy: null,
      updatedBy: null,
      deletedAt: null,
      deletedBy: null,
      isDeleted: false,
      version: 1,
    },
    {
      id: 'perm-3',
      module: 'User Management',
      subModule: null,
      feature: 'Roles',
      screen: null,
      name: 'View Roles',
      code: 'ROLE_VIEW',
      displayName: 'View Roles',
      description: 'View roles list',
      action: 'VIEW',
      permissionType: 'FEATURE',
      resourceType: null,
      resourceName: null,
      apiEndpoint: null,
      httpMethod: null,
      frontendRoute: null,
      menuKey: null,
      icon: null,
      displayOrder: null,
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
      createdBy: null,
      updatedBy: null,
      deletedAt: null,
      deletedBy: null,
      isDeleted: false,
      version: 1,
    },
  ];

  const mockPermission0: Permission | undefined = mockPermissions[0];
  const mockArchivedPermission: Permission | null = mockPermission0
    ? {
        ...mockPermission0,
        id: 'archived-perm-id',
        status: 'INACTIVE',
        isActive: false,
        isDeprecated: true,
      }
    : null;

  const mockModule: Module = {
    id: 'module-1',
    name: 'User Management',
    code: 'USER_MGMT',
    displayName: 'User Management',
    description: 'User management module',
    parentModuleId: null,
    level: 0,
    displayOrder: 1,
    route: '/users',
    icon: 'users',
    menuKey: 'users',
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
    category: null,
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

  function createMockRolePermission(
    roleId: string,
    permission: Permission,
    module: Module,
    overrides: Partial<RolePermissionModel> = {},
  ): RolePermissionModel & {
    permission: Permission;
    module: { id: string; name: string; code: string; displayName: string | null };
  } {
    return {
      id: `rp-${permission.id}`,
      roleId,
      permissionId: permission.id,
      moduleId: module.id,
      effect: 'ALLOW',
      scope: 'GLOBAL',
      conditionExpression: null,
      fieldRestrictions: null,
      rowFilter: null,
      effectiveFrom: null,
      effectiveTo: null,
      isInherited: false,
      isSystemAssigned: false,
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
      permission,
      module: {
        id: module.id,
        name: module.name,
        code: module.code,
        displayName: module.displayName,
      },
      ...overrides,
    };
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolePermissionService,
        {
          provide: AuthRepository,
          useValue: {
            findRoleById: jest.fn(),
            findPermissionsByIds: jest.fn(),
            findModuleByName: jest.fn(),
            $transaction: jest.fn(),
            deleteRolePermissions: jest.fn(),
            createRolePermissions: jest.fn(),
            findRolePermissions: jest.fn(),
            createActivityLog: jest.fn(),
          },
        },
        {
          provide: EventEmitter2,
          useValue: { emit: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<RolePermissionService>(RolePermissionService);
    authRepository = module.get(AuthRepository);
    eventEmitter = module.get(EventEmitter2);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('replacePermissions', () => {
    it('should replace permissions successfully', async () => {
      authRepository.findRoleById.mockResolvedValue(mockRole);
      authRepository.findPermissionsByIds.mockResolvedValue(mockPermissions);
      authRepository.findModuleByName.mockResolvedValue(mockModule);
      mockTransaction(authRepository);
      authRepository.createRolePermissions.mockResolvedValue([]);

      const result = await service.replacePermissions('role-id-1', 'company-id-1', 'user-1', {
        permissionIds: ['perm-1', 'perm-2', 'perm-3'],
      });

      expect(result.success).toBe(true);
      expect(result.message).toBe('Role permissions updated successfully');
      expect(authRepository.deleteRolePermissions).toHaveBeenCalledWith('role-id-1', {});
      expect(authRepository.createRolePermissions).toHaveBeenCalled();
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        RolePermissionsUpdatedEvent.eventName,
        expect.any(RolePermissionsUpdatedEvent),
      );
      expect(authRepository.createActivityLog).toHaveBeenCalled();
    });

    it('should throw RoleNotFoundException when role does not exist', async () => {
      authRepository.findRoleById.mockResolvedValue(null);

      await expect(
        service.replacePermissions('invalid-role', 'company-id-1', 'user-1', {
          permissionIds: ['perm-1'],
        }),
      ).rejects.toThrow(RoleNotFoundException);
    });

    it('should throw RoleNotFoundException when role belongs to different company', async () => {
      const otherCompanyRole = { ...mockRole, companyId: 'other-company' };
      authRepository.findRoleById.mockResolvedValue(otherCompanyRole);

      await expect(
        service.replacePermissions('role-id-1', 'company-id-1', 'user-1', {
          permissionIds: ['perm-1'],
        }),
      ).rejects.toThrow(RoleNotFoundException);
    });

    it('should throw InactiveRoleException when role is inactive', async () => {
      authRepository.findRoleById.mockResolvedValue(mockInactiveRole);

      await expect(
        service.replacePermissions('inactive-role-id', 'company-id-1', 'user-1', {
          permissionIds: ['perm-1'],
        }),
      ).rejects.toThrow(InactiveRoleException);
    });

    it('should throw InactiveRoleException when role is archived', async () => {
      authRepository.findRoleById.mockResolvedValue(mockArchivedRole);

      await expect(
        service.replacePermissions('archived-role-id', 'company-id-1', 'user-1', {
          permissionIds: ['perm-1'],
        }),
      ).rejects.toThrow(InactiveRoleException);
    });

    it('should throw SystemRoleModificationException when role is a system role', async () => {
      authRepository.findRoleById.mockResolvedValue(mockSystemRole);

      await expect(
        service.replacePermissions('system-role-id', 'company-id-1', 'user-1', {
          permissionIds: ['perm-1'],
        }),
      ).rejects.toThrow(SystemRoleModificationException);
    });

    it('should throw DuplicatePermissionAssignmentException for duplicate IDs', async () => {
      authRepository.findRoleById.mockResolvedValue(mockRole);

      await expect(
        service.replacePermissions('role-id-1', 'company-id-1', 'user-1', {
          permissionIds: ['perm-1', 'perm-1'],
        }),
      ).rejects.toThrow(DuplicatePermissionAssignmentException);
    });

    it('should throw PermissionNotFoundException when a permission does not exist', async () => {
      const perm = mockPermissions[0];
      authRepository.findRoleById.mockResolvedValue(mockRole);
      authRepository.findPermissionsByIds.mockResolvedValue(perm ? [perm] : []);

      await expect(
        service.replacePermissions('role-id-1', 'company-id-1', 'user-1', {
          permissionIds: ['perm-1', 'nonexistent-perm'],
        }),
      ).rejects.toThrow(PermissionNotFoundException);
    });

    it('should throw PermissionArchivedException when permission is archived', async () => {
      authRepository.findRoleById.mockResolvedValue(mockRole);
      authRepository.findPermissionsByIds.mockResolvedValue(
        mockArchivedPermission ? [mockArchivedPermission] : [],
      );

      await expect(
        service.replacePermissions('role-id-1', 'company-id-1', 'user-1', {
          permissionIds: ['archived-perm-id'],
        }),
      ).rejects.toThrow(PermissionArchivedException);
    });

    it('should handle empty permission list gracefully', async () => {
      authRepository.findRoleById.mockResolvedValue(mockRole);
      authRepository.findPermissionsByIds.mockResolvedValue([]);
      mockTransaction(authRepository);

      const result = await service.replacePermissions('role-id-1', 'company-id-1', 'user-1', {
        permissionIds: [],
      });

      expect(result.success).toBe(true);
      expect(authRepository.deleteRolePermissions).toHaveBeenCalledWith('role-id-1', {});
      expect(authRepository.createRolePermissions).not.toHaveBeenCalled();
    });

    it('should resolve module IDs correctly from permission module names', async () => {
      authRepository.findRoleById.mockResolvedValue(mockRole);
      authRepository.findPermissionsByIds.mockResolvedValue(mockPermissions);
      authRepository.findModuleByName.mockResolvedValue(mockModule);
      mockTransaction(authRepository);
      authRepository.createRolePermissions.mockResolvedValue([]);

      await service.replacePermissions('role-id-1', 'company-id-1', 'user-1', {
        permissionIds: ['perm-1', 'perm-2', 'perm-3'],
      });

      expect(authRepository.findModuleByName).toHaveBeenCalledWith('User Management');
    });

    it('should perform operations inside a transaction', async () => {
      const perm0 = mockPermissions[0];
      authRepository.findRoleById.mockResolvedValue(mockRole);
      authRepository.findPermissionsByIds.mockResolvedValue(perm0 ? [perm0] : []);
      authRepository.findModuleByName.mockResolvedValue(mockModule);
      mockTransaction(authRepository);
      authRepository.createRolePermissions.mockResolvedValue([]);

      await service.replacePermissions('role-id-1', 'company-id-1', 'user-1', {
        permissionIds: ['perm-1'],
      });

      expect(authRepository.$transaction).toHaveBeenCalled();
      expect(authRepository.deleteRolePermissions).toHaveBeenCalled();
      expect(authRepository.createRolePermissions).toHaveBeenCalled();
    });
  });

  describe('getPermissionsByRole', () => {
    it('should return permissions grouped by module and feature', async () => {
      authRepository.findRoleById.mockResolvedValue(mockRole);
      const rolePerms = mockPermissions.map((p) =>
        createMockRolePermission('role-id-1', p, mockModule),
      );
      authRepository.findRolePermissions.mockResolvedValue(rolePerms);

      const result = await service.getPermissionsByRole('role-id-1', 'company-id-1');

      expect(result.success).toBe(true);
      expect(result.data.roleId).toBe('role-id-1');
      expect(result.data.roleName).toBe('Sales Manager');
      expect(result.data.permissions).toHaveLength(1);
      const firstModule = result.data.permissions[0];
      expect(firstModule?.module).toBe('User Management');
      expect(firstModule?.features).toHaveLength(2);
    });

    it('should throw RoleNotFoundException when role does not exist', async () => {
      authRepository.findRoleById.mockResolvedValue(null);

      await expect(service.getPermissionsByRole('invalid-role', 'company-id-1')).rejects.toThrow(
        RoleNotFoundException,
      );
    });

    it('should throw RoleNotFoundException when role belongs to different company', async () => {
      authRepository.findRoleById.mockResolvedValue({ ...mockRole, companyId: 'other-company' });

      await expect(service.getPermissionsByRole('role-id-1', 'company-id-1')).rejects.toThrow(
        RoleNotFoundException,
      );
    });

    it('should return empty permissions when no assignments exist', async () => {
      authRepository.findRoleById.mockResolvedValue(mockRole);
      authRepository.findRolePermissions.mockResolvedValue([]);

      const result = await service.getPermissionsByRole('role-id-1', 'company-id-1');

      expect(result.success).toBe(true);
      expect(result.data.permissions).toHaveLength(0);
    });

    it('should correctly set assigned and inherited flags', async () => {
      authRepository.findRoleById.mockResolvedValue(mockRole);

      const rolePerms = mockPermissions.slice(0, 2).map((p, i) =>
        createMockRolePermission('role-id-1', p, mockModule, {
          isInherited: i === 1,
        }),
      );
      authRepository.findRolePermissions.mockResolvedValue(rolePerms);

      const result = await service.getPermissionsByRole('role-id-1', 'company-id-1');

      const allPerms = result.data.permissions.flatMap((m) =>
        m.features.flatMap((f) => f.permissions),
      );
      const viewPerm = allPerms.find((p) => p.code === 'USER_VIEW');
      const createPerm = allPerms.find((p) => p.code === 'USER_CREATE');
      expect(viewPerm?.assigned).toBe(true);
      expect(viewPerm?.inherited).toBe(false);
      expect(createPerm?.assigned).toBe(false);
      expect(createPerm?.inherited).toBe(true);
    });
  });

  describe('getEffectivePermissions', () => {
    it('should return flat permission list with all metadata', async () => {
      authRepository.findRoleById.mockResolvedValue(mockRole);
      const rolePerms = mockPermissions
        .slice(0, 2)
        .map((p) => createMockRolePermission('role-id-1', p, mockModule));
      authRepository.findRolePermissions.mockResolvedValue(rolePerms);

      const result = await service.getEffectivePermissions('role-id-1', 'company-id-1');

      expect(result.success).toBe(true);
      expect(result.data.permissions).toHaveLength(2);
      const firstPerm = result.data.permissions[0];
      expect(firstPerm?.code).toBe('USER_VIEW');
      expect(firstPerm?.effect).toBe('ALLOW');
      expect(firstPerm?.scope).toBe('GLOBAL');
      expect(firstPerm?.inherited).toBe(false);
      expect(firstPerm?.module).toBe('User Management');
    });

    it('should throw RoleNotFoundException when role does not exist', async () => {
      authRepository.findRoleById.mockResolvedValue(null);

      await expect(service.getEffectivePermissions('invalid-role', 'company-id-1')).rejects.toThrow(
        RoleNotFoundException,
      );
    });
  });

  describe('copyPermissions', () => {
    it('should copy permissions from source to target role successfully', async () => {
      const sourceRole = { ...mockRole, id: 'source-role', name: 'Source Role' };
      authRepository.findRoleById.mockResolvedValueOnce(sourceRole);
      authRepository.findRoleById.mockResolvedValueOnce(mockRole);

      const sourcePerms = mockPermissions.map((p) =>
        createMockRolePermission('source-role', p, mockModule),
      );
      authRepository.findRolePermissions.mockResolvedValue(sourcePerms);

      mockTransaction(authRepository);
      authRepository.createRolePermissions.mockResolvedValue([]);

      const result = await service.copyPermissions('role-id-1', 'company-id-1', 'user-1', {
        sourceRoleId: 'source-role',
      });

      expect(result.success).toBe(true);
      expect(result.message).toBe('Role permissions copied successfully');
      expect(authRepository.findRoleById).toHaveBeenCalledTimes(2);
      expect(authRepository.deleteRolePermissions).toHaveBeenCalledWith('role-id-1', {});
      expect(authRepository.createRolePermissions).toHaveBeenCalled();
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        RolePermissionsCopiedEvent.eventName,
        expect.any(RolePermissionsCopiedEvent),
      );
      expect(authRepository.createActivityLog).toHaveBeenCalled();
    });

    it('should throw RoleNotFoundException when source role does not exist', async () => {
      authRepository.findRoleById.mockResolvedValueOnce(null);

      await expect(
        service.copyPermissions('role-id-1', 'company-id-1', 'user-1', {
          sourceRoleId: 'invalid-source',
        }),
      ).rejects.toThrow(RoleNotFoundException);
    });

    it('should throw RoleNotFoundException when target role does not exist', async () => {
      authRepository.findRoleById.mockResolvedValueOnce(mockRole);
      authRepository.findRoleById.mockResolvedValueOnce(null);

      await expect(
        service.copyPermissions('invalid-target', 'company-id-1', 'user-1', {
          sourceRoleId: 'source-role',
        }),
      ).rejects.toThrow(RoleNotFoundException);
    });

    it('should throw SystemRoleModificationException when target role is system role', async () => {
      authRepository.findRoleById.mockResolvedValueOnce(mockRole);
      authRepository.findRoleById.mockResolvedValueOnce(mockSystemRole);

      await expect(
        service.copyPermissions('system-role-id', 'company-id-1', 'user-1', {
          sourceRoleId: 'source-role',
        }),
      ).rejects.toThrow(SystemRoleModificationException);
    });

    it('should return early message when source role has no permissions', async () => {
      authRepository.findRoleById.mockResolvedValueOnce(mockRole);
      authRepository.findRoleById.mockResolvedValueOnce(mockRole);
      authRepository.findRolePermissions.mockResolvedValue([]);

      const result = await service.copyPermissions('role-id-1', 'company-id-1', 'user-1', {
        sourceRoleId: 'source-role',
      });

      expect(result.success).toBe(true);
      expect(result.message).toBe('Source role has no permissions to copy');
      expect(authRepository.$transaction).not.toHaveBeenCalled();
    });

    it('should throw RoleNotFoundException when source role belongs to different company', async () => {
      const otherCompanyRole = { ...mockRole, id: 'source-role', companyId: 'other-company' };
      authRepository.findRoleById.mockResolvedValueOnce(otherCompanyRole);

      await expect(
        service.copyPermissions('role-id-1', 'company-id-1', 'user-1', {
          sourceRoleId: 'source-role',
        }),
      ).rejects.toThrow(RoleNotFoundException);
    });

    it('should throw RoleNotFoundException when target role belongs to different company', async () => {
      const otherCompanyRole = { ...mockRole, id: 'source-role', companyId: 'other-company' };
      authRepository.findRoleById.mockResolvedValueOnce(otherCompanyRole);
      authRepository.findRoleById.mockResolvedValueOnce(mockRole);

      await expect(
        service.copyPermissions('role-id-1', 'company-id-1', 'user-1', {
          sourceRoleId: 'source-role',
        }),
      ).rejects.toThrow(RoleNotFoundException);
    });
  });

  describe('clearPermissions', () => {
    it('should clear all permissions for a role successfully', async () => {
      authRepository.findRoleById.mockResolvedValue(mockRole);
      authRepository.deleteRolePermissions.mockResolvedValue({ count: 3 });

      const result = await service.clearPermissions('role-id-1', 'company-id-1', 'user-1');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Role permissions cleared successfully');
      expect(authRepository.deleteRolePermissions).toHaveBeenCalledWith('role-id-1');
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        RolePermissionsClearedEvent.eventName,
        expect.any(RolePermissionsClearedEvent),
      );
      expect(authRepository.createActivityLog).toHaveBeenCalled();
    });

    it('should throw RoleNotFoundException when role does not exist', async () => {
      authRepository.findRoleById.mockResolvedValue(null);

      await expect(
        service.clearPermissions('invalid-role', 'company-id-1', 'user-1'),
      ).rejects.toThrow(RoleNotFoundException);
    });

    it('should throw RoleNotFoundException when role belongs to different company', async () => {
      authRepository.findRoleById.mockResolvedValue({ ...mockRole, companyId: 'other-company' });

      await expect(service.clearPermissions('role-id-1', 'company-id-1', 'user-1')).rejects.toThrow(
        RoleNotFoundException,
      );
    });

    it('should throw SystemRoleModificationException when role is a system role', async () => {
      authRepository.findRoleById.mockResolvedValue(mockSystemRole);

      await expect(
        service.clearPermissions('system-role-id', 'company-id-1', 'user-1'),
      ).rejects.toThrow(SystemRoleModificationException);
    });
  });
});
