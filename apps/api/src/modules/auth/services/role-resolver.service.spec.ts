/* eslint-disable @typescript-eslint/no-explicit-any */
import { Test, type TestingModule } from '@nestjs/testing';
import type { UserRole, Role } from '@prisma/client';
import { RoleResolver } from './role-resolver.service';
import { AuthRepository } from '../repositories/auth.repository';

describe('RoleResolver', () => {
  let service: RoleResolver;
  let authRepository: jest.Mocked<AuthRepository>;

  const mockParentRole: Partial<Role> = {
    id: 'parent-role',
    name: 'Parent Role',
    code: 'PARENT_ROLE',
    displayName: 'Parent Role',
    description: 'Parent description',
    roleType: 'CUSTOM' as any,
    hierarchyLevel: 1,
    priority: 1,
    parentRoleId: null,
    isSystemRole: false,
    isActive: true,
    isDeleted: false,
    status: 'ACTIVE' as any,
  };

  const mockRole: Partial<Role> = {
    id: 'role-1',
    name: 'Sales Manager',
    code: 'SALES_MANAGER',
    displayName: 'Sales Manager',
    description: 'Manages sales',
    roleType: 'CUSTOM' as any,
    hierarchyLevel: 2,
    priority: 10,
    parentRoleId: 'parent-role',
    isSystemRole: false,
    isActive: true,
    isDeleted: false,
    status: 'ACTIVE' as any,
  };

  const mockRole2: Partial<Role> = {
    ...mockRole,
    id: 'role-2',
    name: 'Sales Executive',
    code: 'SALES_EXEC',
    displayName: 'Sales Executive',
    priority: 20,
  };

  const mockUserRole = (
    role: Partial<Role>,
    overrides: Partial<UserRole> = {},
  ): Partial<UserRole> & { role: Partial<Role> } => ({
    id: `ur-${role.id}`,
    companyUserId: 'cu-1',
    roleId: role.id ?? '',
    isPrimaryRole: false,
    isActive: true,
    status: 'ACTIVE' as any,
    effectiveFrom: null,
    effectiveTo: null,
    priority: role.priority ?? 0,
    role,
    ...overrides,
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoleResolver,
        {
          provide: AuthRepository,
          useValue: {
            findActiveUserRolesByCompanyUser: jest.fn(),
            findRolesByIds: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<RoleResolver>(RoleResolver);
    authRepository = module.get(AuthRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should resolve roles successfully', async () => {
    const userRoles = [mockUserRole(mockRole), mockUserRole(mockRole2)];
    authRepository.findActiveUserRolesByCompanyUser.mockResolvedValue(userRoles as any);
    authRepository.findRolesByIds.mockResolvedValue([]);

    const result = await service.resolve('cu-1');

    expect(result.roles).toHaveLength(2);
    expect(result.roleIds).toHaveLength(2);
    expect(result.roleCodes).toEqual(['SALES_MANAGER', 'SALES_EXEC']);
    expect(result.primaryRole).not.toBeNull();
    expect(result.primaryRole?.code).toBe('SALES_MANAGER');
  });

  it('should return empty result when no user roles exist', async () => {
    authRepository.findActiveUserRolesByCompanyUser.mockResolvedValue([]);

    const result = await service.resolve('cu-1');

    expect(result.roles).toHaveLength(0);
    expect(result.roleIds).toHaveLength(0);
    expect(result.roleCodes).toHaveLength(0);
    expect(result.primaryRole).toBeNull();
  });

  it('should filter out inactive user roles', async () => {
    const userRoles = [
      mockUserRole(mockRole, { isActive: false }),
      mockUserRole(mockRole2, { isActive: true }),
    ];
    authRepository.findActiveUserRolesByCompanyUser.mockResolvedValue(userRoles as any);
    authRepository.findRolesByIds.mockResolvedValue([]);

    const result = await service.resolve('cu-1');

    expect(result.roles).toHaveLength(1);
    expect(result.roleCodes).toEqual(['SALES_EXEC']);
  });

  it('should filter out expired user roles', async () => {
    const userRoles = [
      mockUserRole(mockRole, { effectiveTo: new Date('2020-01-01') }),
      mockUserRole(mockRole2),
    ];
    authRepository.findActiveUserRolesByCompanyUser.mockResolvedValue(userRoles as any);
    authRepository.findRolesByIds.mockResolvedValue([]);

    const result = await service.resolve('cu-1');

    expect(result.roles).toHaveLength(1);
    expect(result.roleCodes).toEqual(['SALES_EXEC']);
  });

  it('should filter out not-yet-effective roles', async () => {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    const userRoles = [
      mockUserRole(mockRole, { effectiveFrom: futureDate }),
      mockUserRole(mockRole2),
    ];
    authRepository.findActiveUserRolesByCompanyUser.mockResolvedValue(userRoles as any);
    authRepository.findRolesByIds.mockResolvedValue([]);

    const result = await service.resolve('cu-1');

    expect(result.roles).toHaveLength(1);
    expect(result.roleCodes).toEqual(['SALES_EXEC']);
  });

  it('should resolve role hierarchy (parent roles)', async () => {
    const userRoles = [mockUserRole(mockRole)];
    authRepository.findActiveUserRolesByCompanyUser.mockResolvedValue(userRoles as any);
    authRepository.findRolesByIds.mockResolvedValue([]);
    authRepository.findRolesByIds.mockResolvedValueOnce([mockRole] as any);
    authRepository.findRolesByIds.mockResolvedValueOnce([mockParentRole] as any);
    authRepository.findRolesByIds.mockResolvedValueOnce([mockParentRole] as any);

    const result = await service.resolve('cu-1');

    expect(result.roles).toHaveLength(2);
    expect(result.roleIds).toContain('role-1');
    expect(result.roleIds).toContain('parent-role');
    expect(result.roleCodes).toContain('SALES_MANAGER');
    expect(result.roleCodes).toContain('PARENT_ROLE');
  });

  it('should mark isPrimary based on isPrimaryRole flag', async () => {
    const userRoles = [
      mockUserRole(mockRole, { isPrimaryRole: true }),
      mockUserRole(mockRole2, { isPrimaryRole: false }),
    ];
    authRepository.findActiveUserRolesByCompanyUser.mockResolvedValue(userRoles as any);
    authRepository.findRolesByIds.mockResolvedValue([]);

    const result = await service.resolve('cu-1');

    const primaryRoles = result.roles.filter((r) => r.isPrimary);
    expect(primaryRoles).toHaveLength(1);
    expect(primaryRoles[0]?.code).toBe('SALES_MANAGER');
  });

  it('should use lowest priority as primary when no explicit primary', async () => {
    const userRoles = [
      mockUserRole(mockRole, { isPrimaryRole: false }),
      mockUserRole(mockRole2, { isPrimaryRole: false }),
    ];
    authRepository.findActiveUserRolesByCompanyUser.mockResolvedValue(userRoles as any);
    authRepository.findRolesByIds.mockResolvedValue([]);

    const result = await service.resolve('cu-1');

    expect(result.primaryRole?.code).toBe('SALES_MANAGER');
    expect(result.primaryRole?.priority).toBe(10);
  });

  it('should sort roles by priority ascending', async () => {
    const userRoles = [
      mockUserRole(mockRole2), // priority 20
      mockUserRole(mockRole), // priority 10
    ];
    authRepository.findActiveUserRolesByCompanyUser.mockResolvedValue(userRoles as any);
    authRepository.findRolesByIds.mockResolvedValue([]);

    const result = await service.resolve('cu-1');

    expect(result.roles[0]?.priority).toBeLessThanOrEqual(result.roles[1]?.priority ?? 999);
  });

  it('should return empty result when all roles are expired', async () => {
    const userRoles = [mockUserRole(mockRole, { effectiveTo: new Date('2020-01-01') })];
    authRepository.findActiveUserRolesByCompanyUser.mockResolvedValue(userRoles as any);

    const result = await service.resolve('cu-1');

    expect(result.roles).toHaveLength(0);
    expect(result.primaryRole).toBeNull();
  });
});
