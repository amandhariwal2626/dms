import { Test, type TestingModule } from '@nestjs/testing';
import { AuthorizationService } from './authorization.service';
import { CompanyContextResolver } from './company-context-resolver.service';
import { RoleResolver } from './role-resolver.service';
import { PermissionResolver } from './permission-resolver.service';
import { PermissionCacheService, InMemoryCacheProvider } from './permission-cache.service';
import type {
  AuthorizationCompanyContext,
  RolesResult,
  EffectivePermissionSet,
} from '../types/authorization.types';

describe('AuthorizationService', () => {
  let service: AuthorizationService;
  let companyContextResolver: jest.Mocked<CompanyContextResolver>;
  let roleResolver: jest.Mocked<RoleResolver>;
  let permissionResolver: jest.Mocked<PermissionResolver>;
  let cacheService: PermissionCacheService;

  const mockContext: AuthorizationCompanyContext = {
    companyId: 'company-1',
    companyUserId: 'cu-1',
    companyCode: 'C001',
    legalName: 'Test Corp',
    displayName: null,
    companyStatus: 'ACTIVE',
    companyIsActive: true,
    membershipStatus: 'ACTIVE',
    membershipIsActive: true,
    isDefaultCompany: true,
    isPrimaryCompany: true,
  };

  const mockRolesResult: RolesResult = {
    roles: [
      {
        roleId: 'role-1',
        name: 'Admin',
        code: 'ADMIN',
        displayName: 'Admin',
        description: 'Admin role',
        roleType: 'SYSTEM',
        hierarchyLevel: 1,
        priority: 1,
        parentRoleId: null,
        isPrimary: true,
        isSystemRole: true,
        isUserRoleActive: true,
      },
    ],
    roleIds: ['role-1'],
    roleCodes: ['ADMIN'],
    primaryRole: {
      roleId: 'role-1',
      name: 'Admin',
      code: 'ADMIN',
      displayName: 'Admin',
      description: 'Admin role',
      roleType: 'SYSTEM',
      hierarchyLevel: 1,
      priority: 1,
      parentRoleId: null,
      isPrimary: true,
      isSystemRole: true,
      isUserRoleActive: true,
    },
  };

  const mockPermissionSet: EffectivePermissionSet = {
    permissions: [
      {
        permissionId: 'perm-1',
        name: 'View Users',
        code: 'USER_VIEW',
        displayName: 'View Users',
        action: 'VIEW',
        effect: 'ALLOW',
        scope: 'GLOBAL',
        module: 'User Management',
        feature: 'User List',
        screen: null,
        permissionType: 'FEATURE',
        isInherited: false,
        isSystemAssignment: false,
        roleId: 'role-1',
      },
      {
        permissionId: 'perm-2',
        name: 'Create Users',
        code: 'USER_CREATE',
        displayName: 'Create Users',
        action: 'CREATE',
        effect: 'ALLOW',
        scope: 'GLOBAL',
        module: 'User Management',
        feature: 'User List',
        screen: null,
        permissionType: 'ACTION',
        isInherited: false,
        isSystemAssignment: false,
        roleId: 'role-1',
      },
    ],
    permissionCodes: ['USER_VIEW', 'USER_CREATE'],
    moduleAccess: ['User Management'],
    actionAccess: ['VIEW', 'CREATE'],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthorizationService,
        {
          provide: CompanyContextResolver,
          useValue: {
            resolve: jest.fn(),
          },
        },
        {
          provide: RoleResolver,
          useValue: {
            resolve: jest.fn(),
          },
        },
        {
          provide: PermissionResolver,
          useValue: {
            resolve: jest.fn(),
          },
        },
        InMemoryCacheProvider,
        {
          provide: 'CACHE_PROVIDER',
          useExisting: InMemoryCacheProvider,
        },
        PermissionCacheService,
      ],
    }).compile();

    service = module.get<AuthorizationService>(AuthorizationService);
    companyContextResolver = module.get(CompanyContextResolver);
    roleResolver = module.get(RoleResolver);
    permissionResolver = module.get(PermissionResolver);
    cacheService = module.get(PermissionCacheService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    cacheService.invalidateAll();
  });

  describe('hasPermission', () => {
    it('should return true when user has the permission', async () => {
      companyContextResolver.resolve.mockResolvedValue(mockContext);
      roleResolver.resolve.mockResolvedValue(mockRolesResult);
      permissionResolver.resolve.mockResolvedValue(mockPermissionSet);

      const result = await service.hasPermission('user-1', 'company-1', 'USER_VIEW');
      expect(result).toBe(true);
    });

    it('should return false when user does not have the permission', async () => {
      companyContextResolver.resolve.mockResolvedValue(mockContext);
      roleResolver.resolve.mockResolvedValue(mockRolesResult);
      permissionResolver.resolve.mockResolvedValue(mockPermissionSet);

      const result = await service.hasPermission('user-1', 'company-1', 'PRODUCT_CREATE');
      expect(result).toBe(false);
    });

    it('should use cache on subsequent calls', async () => {
      companyContextResolver.resolve.mockResolvedValue(mockContext);
      roleResolver.resolve.mockResolvedValue(mockRolesResult);
      permissionResolver.resolve.mockResolvedValue(mockPermissionSet);

      await service.hasPermission('user-1', 'company-1', 'USER_VIEW');
      await service.hasPermission('user-1', 'company-1', 'USER_CREATE');

      expect(companyContextResolver.resolve).toHaveBeenCalledTimes(1);
      expect(roleResolver.resolve).toHaveBeenCalledTimes(1);
      expect(permissionResolver.resolve).toHaveBeenCalledTimes(1);
    });
  });

  describe('hasAnyPermission', () => {
    it('should return true when user has at least one permission', async () => {
      companyContextResolver.resolve.mockResolvedValue(mockContext);
      roleResolver.resolve.mockResolvedValue(mockRolesResult);
      permissionResolver.resolve.mockResolvedValue(mockPermissionSet);

      const result = await service.hasAnyPermission('user-1', 'company-1', [
        'PRODUCT_CREATE',
        'USER_VIEW',
      ]);
      expect(result).toBe(true);
    });

    it('should return false when user has none of the permissions', async () => {
      companyContextResolver.resolve.mockResolvedValue(mockContext);
      roleResolver.resolve.mockResolvedValue(mockRolesResult);
      permissionResolver.resolve.mockResolvedValue(mockPermissionSet);

      const result = await service.hasAnyPermission('user-1', 'company-1', [
        'PRODUCT_CREATE',
        'ORDER_VIEW',
      ]);
      expect(result).toBe(false);
    });
  });

  describe('hasAllPermissions', () => {
    it('should return true when user has all permissions', async () => {
      companyContextResolver.resolve.mockResolvedValue(mockContext);
      roleResolver.resolve.mockResolvedValue(mockRolesResult);
      permissionResolver.resolve.mockResolvedValue(mockPermissionSet);

      const result = await service.hasAllPermissions('user-1', 'company-1', [
        'USER_VIEW',
        'USER_CREATE',
      ]);
      expect(result).toBe(true);
    });

    it('should return false when user lacks one of the permissions', async () => {
      companyContextResolver.resolve.mockResolvedValue(mockContext);
      roleResolver.resolve.mockResolvedValue(mockRolesResult);
      permissionResolver.resolve.mockResolvedValue(mockPermissionSet);

      const result = await service.hasAllPermissions('user-1', 'company-1', [
        'USER_VIEW',
        'PRODUCT_CREATE',
      ]);
      expect(result).toBe(false);
    });
  });

  describe('hasModuleAccess', () => {
    it('should return true when user has access to the module', async () => {
      companyContextResolver.resolve.mockResolvedValue(mockContext);
      roleResolver.resolve.mockResolvedValue(mockRolesResult);
      permissionResolver.resolve.mockResolvedValue(mockPermissionSet);

      const result = await service.hasModuleAccess('user-1', 'company-1', 'User Management');
      expect(result).toBe(true);
    });

    it('should return false when user lacks module access', async () => {
      companyContextResolver.resolve.mockResolvedValue(mockContext);
      roleResolver.resolve.mockResolvedValue(mockRolesResult);
      permissionResolver.resolve.mockResolvedValue(mockPermissionSet);

      const result = await service.hasModuleAccess('user-1', 'company-1', 'Products');
      expect(result).toBe(false);
    });
  });

  describe('hasActionAccess', () => {
    it('should return true when user has the action', async () => {
      companyContextResolver.resolve.mockResolvedValue(mockContext);
      roleResolver.resolve.mockResolvedValue(mockRolesResult);
      permissionResolver.resolve.mockResolvedValue(mockPermissionSet);

      const result = await service.hasActionAccess('user-1', 'company-1', 'VIEW');
      expect(result).toBe(true);
    });

    it('should return false when user lacks the action', async () => {
      companyContextResolver.resolve.mockResolvedValue(mockContext);
      roleResolver.resolve.mockResolvedValue(mockRolesResult);
      permissionResolver.resolve.mockResolvedValue(mockPermissionSet);

      const result = await service.hasActionAccess('user-1', 'company-1', 'DELETE');
      expect(result).toBe(false);
    });
  });

  describe('hasRole', () => {
    it('should return true when user has the role', async () => {
      companyContextResolver.resolve.mockResolvedValue(mockContext);
      roleResolver.resolve.mockResolvedValue(mockRolesResult);
      permissionResolver.resolve.mockResolvedValue(mockPermissionSet);

      const result = await service.hasRole('user-1', 'company-1', 'ADMIN');
      expect(result).toBe(true);
    });

    it('should return false when user lacks the role', async () => {
      companyContextResolver.resolve.mockResolvedValue(mockContext);
      roleResolver.resolve.mockResolvedValue(mockRolesResult);
      permissionResolver.resolve.mockResolvedValue(mockPermissionSet);

      const result = await service.hasRole('user-1', 'company-1', 'MANAGER');
      expect(result).toBe(false);
    });
  });

  describe('getEffectivePermissions', () => {
    it('should return all resolved permissions', async () => {
      companyContextResolver.resolve.mockResolvedValue(mockContext);
      roleResolver.resolve.mockResolvedValue(mockRolesResult);
      permissionResolver.resolve.mockResolvedValue(mockPermissionSet);

      const result = await service.getEffectivePermissions('user-1', 'company-1');

      expect(result).toHaveLength(2);
      expect(result.map((p) => p.code)).toEqual(['USER_VIEW', 'USER_CREATE']);
    });
  });

  describe('getEffectiveRoles', () => {
    it('should return all resolved roles', async () => {
      companyContextResolver.resolve.mockResolvedValue(mockContext);
      roleResolver.resolve.mockResolvedValue(mockRolesResult);
      permissionResolver.resolve.mockResolvedValue(mockPermissionSet);

      const result = await service.getEffectiveRoles('user-1', 'company-1');

      expect(result).toHaveLength(1);
      expect(result[0]?.code).toBe('ADMIN');
    });
  });

  describe('getCurrentCompanyContext', () => {
    it('should return company context', async () => {
      companyContextResolver.resolve.mockResolvedValue(mockContext);
      roleResolver.resolve.mockResolvedValue(mockRolesResult);
      permissionResolver.resolve.mockResolvedValue(mockPermissionSet);

      const result = await service.getCurrentCompanyContext('user-1', 'company-1');

      expect(result.companyId).toBe('company-1');
      expect(result.companyUserId).toBe('cu-1');
    });
  });

  describe('cache invalidation', () => {
    it('should invalidate permission cache for specific user and company', async () => {
      companyContextResolver.resolve.mockResolvedValue(mockContext);
      roleResolver.resolve.mockResolvedValue(mockRolesResult);
      permissionResolver.resolve.mockResolvedValue(mockPermissionSet);

      await service.hasPermission('user-1', 'company-1', 'USER_VIEW');
      service.invalidatePermissionCache('user-1', 'company-1');

      await service.hasPermission('user-1', 'company-1', 'USER_VIEW');

      expect(companyContextResolver.resolve).toHaveBeenCalledTimes(2);
    });

    it('should refresh permission cache', async () => {
      companyContextResolver.resolve.mockResolvedValue(mockContext);
      roleResolver.resolve.mockResolvedValue(mockRolesResult);
      permissionResolver.resolve.mockResolvedValue(mockPermissionSet);

      await service.refreshPermissionCache('user-1', 'company-1');

      expect(companyContextResolver.resolve).toHaveBeenCalledTimes(1);
      expect(roleResolver.resolve).toHaveBeenCalledTimes(1);
      expect(permissionResolver.resolve).toHaveBeenCalledTimes(1);
    });

    it('should invalidate all caches on onRoleChanged', async () => {
      companyContextResolver.resolve.mockResolvedValue(mockContext);
      roleResolver.resolve.mockResolvedValue(mockRolesResult);
      permissionResolver.resolve.mockResolvedValue(mockPermissionSet);

      await service.hasPermission('user-1', 'company-1', 'USER_VIEW');
      await service.hasPermission('user-2', 'company-2', 'USER_VIEW');

      service.onRoleChanged();

      expect(cacheService.getAuthorizationData('company-1', 'user-1')).toBeUndefined();
      expect(cacheService.getAuthorizationData('company-2', 'user-2')).toBeUndefined();
    });

    it('should invalidate cache on onUserRoleChanged', async () => {
      companyContextResolver.resolve.mockResolvedValue(mockContext);
      roleResolver.resolve.mockResolvedValue(mockRolesResult);
      permissionResolver.resolve.mockResolvedValue(mockPermissionSet);

      await service.hasPermission('user-1', 'company-1', 'USER_VIEW');
      service.onUserRoleChanged('user-1', 'company-1');

      await service.hasPermission('user-1', 'company-1', 'USER_VIEW');
      expect(companyContextResolver.resolve).toHaveBeenCalledTimes(2);
    });

    it('should invalidate cache on company switch', async () => {
      companyContextResolver.resolve.mockResolvedValue(mockContext);
      roleResolver.resolve.mockResolvedValue(mockRolesResult);
      permissionResolver.resolve.mockResolvedValue(mockPermissionSet);

      await service.hasPermission('user-1', 'company-1', 'USER_VIEW');
      service.onCompanySwitched('user-1', 'company-1');

      await service.hasPermission('user-1', 'company-1', 'USER_VIEW');
      expect(companyContextResolver.resolve).toHaveBeenCalledTimes(2);
    });

    it('should invalidate cache on logout', () => {
      cacheService.setAuthorizationData('company-1', 'user-1', {
        companyContext: mockContext,
        rolesResult: mockRolesResult,
        permissionSet: mockPermissionSet,
        cachedAt: new Date().toISOString(),
      });

      service.onLogout();

      expect(cacheService.getAuthorizationData('company-1', 'user-1')).toBeUndefined();
    });
  });
});
