/* eslint-disable @typescript-eslint/no-explicit-any */
import { Test, type TestingModule } from '@nestjs/testing';
import type { RolePermission, Permission } from '@prisma/client';
import { PermissionResolver } from './permission-resolver.service';
import { AuthRepository } from '../repositories/auth.repository';

describe('PermissionResolver', () => {
  let service: PermissionResolver;
  let authRepository: jest.Mocked<AuthRepository>;

  const mockPermission: Partial<Permission> = {
    id: 'perm-1',
    name: 'View Users',
    code: 'USER_VIEW',
    displayName: 'View Users',
    action: 'VIEW' as any,
    module: 'User Management',
    feature: 'User List',
    screen: null,
    permissionType: 'FEATURE' as any,
    isDeleted: false,
  };

  const mockPermission2: Partial<Permission> = {
    ...mockPermission,
    id: 'perm-2',
    name: 'Create Users',
    code: 'USER_CREATE',
    displayName: 'Create Users',
    action: 'CREATE' as any,
  };

  const mockPermission3: Partial<Permission> = {
    ...mockPermission,
    id: 'perm-3',
    name: 'Delete Users',
    code: 'USER_DELETE',
    displayName: 'Delete Users',
    action: 'DELETE' as any,
  };

  const mockRolePermission = (
    roleId: string,
    permission: Partial<Permission>,
    overrides: Partial<RolePermission> = {},
  ): Partial<RolePermission> & { permission: Partial<Permission> } => ({
    id: `rp-${permission.id}`,
    roleId,
    permissionId: permission.id ?? '',
    effect: 'ALLOW' as any,
    scope: 'GLOBAL' as any,
    isInherited: false,
    isSystemAssigned: false,
    isDeleted: false,
    isActive: true,
    status: 'ACTIVE' as any,
    moduleId: 'module-1',
    permission,
    ...overrides,
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionResolver,
        {
          provide: AuthRepository,
          useValue: {
            findActiveRolePermissionsByRoleIds: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<PermissionResolver>(PermissionResolver);
    authRepository = module.get(AuthRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should resolve permissions for given role IDs', async () => {
    const rps = [
      mockRolePermission('role-1', mockPermission),
      mockRolePermission('role-1', mockPermission2),
    ];
    authRepository.findActiveRolePermissionsByRoleIds.mockResolvedValue(rps as any);

    const result = await service.resolve(['role-1']);

    expect(result.permissions).toHaveLength(2);
    expect(result.permissionCodes).toEqual(['USER_VIEW', 'USER_CREATE']);
    expect(result.moduleAccess).toEqual(['User Management']);
    expect(result.actionAccess).toContain('VIEW');
    expect(result.actionAccess).toContain('CREATE');
  });

  it('should return empty set for empty role IDs', async () => {
    const result = await service.resolve([]);

    expect(result.permissions).toHaveLength(0);
    expect(result.permissionCodes).toHaveLength(0);
  });

  it('should handle DENY precedence - DENY overrides ALLOW', async () => {
    const rps = [
      mockRolePermission('role-1', mockPermission, { effect: 'ALLOW' as any }),
      mockRolePermission('role-2', mockPermission, { effect: 'DENY' as any }),
    ];
    authRepository.findActiveRolePermissionsByRoleIds.mockResolvedValue(rps as any);

    const result = await service.resolve(['role-1', 'role-2']);

    const perm = result.permissions.find((p) => p.code === 'USER_VIEW');
    expect(perm?.effect).toBe('DENY');
    expect(result.permissionCodes).not.toContain('USER_VIEW');
  });

  it('should ALLOW when no DENY exists', async () => {
    const rps = [
      mockRolePermission('role-1', mockPermission, { effect: 'ALLOW' as any }),
      mockRolePermission('role-2', mockPermission2, { effect: 'ALLOW' as any }),
    ];
    authRepository.findActiveRolePermissionsByRoleIds.mockResolvedValue(rps as any);

    const result = await service.resolve(['role-1', 'role-2']);

    expect(result.permissionCodes).toContain('USER_VIEW');
    expect(result.permissionCodes).toContain('USER_CREATE');
  });

  it('should deduplicate same permission from multiple roles', async () => {
    const rps = [
      mockRolePermission('role-1', mockPermission),
      mockRolePermission('role-2', mockPermission),
    ];
    authRepository.findActiveRolePermissionsByRoleIds.mockResolvedValue(rps as any);

    const result = await service.resolve(['role-1', 'role-2']);

    const viewPerms = result.permissions.filter((p) => p.code === 'USER_VIEW');
    expect(viewPerms).toHaveLength(1);
  });

  it('should group module and action access from allowed permissions only', async () => {
    const rps = [
      mockRolePermission('role-1', mockPermission, { effect: 'ALLOW' as any }),
      mockRolePermission('role-1', mockPermission3, { effect: 'DENY' as any }),
    ];
    authRepository.findActiveRolePermissionsByRoleIds.mockResolvedValue(rps as any);

    const result = await service.resolve(['role-1']);

    expect(result.moduleAccess).toEqual(['User Management']);
    expect(result.actionAccess).toEqual(['VIEW']);
    expect(result.actionAccess).not.toContain('DELETE');
  });

  it('should preserve DENY permissions in full list', async () => {
    const rps = [mockRolePermission('role-1', mockPermission, { effect: 'DENY' as any })];
    authRepository.findActiveRolePermissionsByRoleIds.mockResolvedValue(rps as any);

    const result = await service.resolve(['role-1']);

    expect(result.permissions).toHaveLength(1);
    expect(result.permissions[0]?.effect).toBe('DENY');
    expect(result.permissionCodes).toHaveLength(0);
  });
});
