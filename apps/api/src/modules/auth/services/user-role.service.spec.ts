/* eslint-disable @typescript-eslint/no-explicit-any */
import { Test, type TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AuthRepository } from '../repositories/auth.repository';
import { UserRoleService } from './user-role.service';
import { AuthorizationService } from './authorization.service';
import { RoleNotFoundException } from '../exceptions/role.exceptions';
import {
  DuplicateUserRoleException,
  CannotRemoveLastActiveRoleException,
  CannotRemovePrimaryRoleException,
  RoleNotActiveException,
  UserRoleNotFoundException,
} from '../exceptions/user-role.exceptions';

describe('UserRoleService', () => {
  let service: UserRoleService;
  let authRepository: jest.Mocked<AuthRepository>;
  let eventEmitter: jest.Mocked<EventEmitter2>;
  let authorizationService: jest.Mocked<AuthorizationService>;

  const mockCompanyUser = {
    id: 'cu-1',
    companyId: 'company-1',
    userId: 'user-1',
    isActive: true,
    isDeleted: false,
    status: 'ACTIVE',
    isDefaultCompany: true,
    isPrimaryCompany: true,
    canSwitchCompany: true,
    employeeCode: 'EMP001',
    officialEmail: 'user@test.com',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockRole = {
    id: 'role-1',
    companyId: 'company-1',
    name: 'Sales Manager',
    code: 'SALES_MANAGER',
    displayName: 'Sales Manager',
    description: 'Manages sales team',
    roleType: 'CUSTOM',
    isActive: true,
    status: 'ACTIVE',
    isDeleted: false,
    isSystemRole: false,
    hierarchyLevel: 2,
    priority: 10,
    parentRoleId: null,
  };

  const mockRole2 = {
    ...mockRole,
    id: 'role-2',
    name: 'Sales Rep',
    code: 'SALES_REP',
    displayName: 'Sales Rep',
  };

  const mockUserRole = {
    id: 'ur-1',
    companyUserId: 'cu-1',
    roleId: 'role-1',
    role: mockRole,
    isPrimaryRole: true,
    priority: 10,
    isActive: true,
    status: 'ACTIVE',
    assignedBy: 'admin-1',
    assignedAt: new Date(),
    assignmentReason: null,
    effectiveFrom: null,
    effectiveTo: null,
    source: 'MANUAL',
    scope: 'COMPANY',
    isDeleted: false,
  };

  const mockUserRole2 = {
    ...mockUserRole,
    id: 'ur-2',
    roleId: 'role-2',
    role: mockRole2,
    isPrimaryRole: false,
    priority: 20,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserRoleService,
        {
          provide: AuthRepository,
          useValue: {
            findCompanyUser: jest.fn(),
            findUserRolesByCompanyUserId: jest.fn(),
            findRolesByIds: jest.fn(),
            findActiveUserRoleByCompanyUserAndRoleId: jest.fn(),
            countActiveUserRolesByCompanyUser: jest.fn(),
            createUserRole: jest.fn(),
            updateUserRole: jest.fn(),
            softDeleteUserRole: jest.fn(),
            setPrimaryRole: jest.fn(),
            createActivityLog: jest.fn(),
            $transaction: jest.fn((fn: any) => fn()),
          },
        },
        {
          provide: EventEmitter2,
          useValue: {
            emit: jest.fn(),
          },
        },
        {
          provide: AuthorizationService,
          useValue: {
            onUserRoleChanged: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UserRoleService>(UserRoleService);
    authRepository = module.get(AuthRepository);
    eventEmitter = module.get(EventEmitter2);
    authorizationService = module.get(AuthorizationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getRolesByUser', () => {
    it('should return roles for a user', async () => {
      authRepository.findCompanyUser.mockResolvedValue(mockCompanyUser as any);
      authRepository.findUserRolesByCompanyUserId.mockResolvedValue([
        mockUserRole,
        mockUserRole2,
      ] as any);

      const result = await service.getRolesByUser('user-1', 'company-1');

      expect(result.success).toBe(true);
      expect(result.data.companyUserId).toBe('cu-1');
      expect(result.data.roles).toHaveLength(2);
      expect(result.data.roles[0]?.roleCode).toBe('SALES_MANAGER');
      expect(result.data.roles[1]?.roleCode).toBe('SALES_REP');
    });

    it('should throw when company user not found', async () => {
      authRepository.findCompanyUser.mockResolvedValue(null);

      await expect(service.getRolesByUser('user-1', 'company-1')).rejects.toThrow(
        RoleNotFoundException,
      );
    });

    it('should enforce company isolation', async () => {
      authRepository.findCompanyUser.mockResolvedValue(null);

      await expect(service.getRolesByUser('user-1', 'wrong-company')).rejects.toThrow(
        RoleNotFoundException,
      );
    });
  });

  describe('getProfileRoles', () => {
    it('should return roles for current user profile', async () => {
      authRepository.findUserRolesByCompanyUserId.mockResolvedValue([mockUserRole] as any);

      const result = await service.getProfileRoles('user-1', 'company-1', 'cu-1');

      expect(result.success).toBe(true);
      expect(result.data.companyUserId).toBe('cu-1');
      expect(result.data.roles).toHaveLength(1);
    });
  });

  describe('assignRoles', () => {
    const assignDto = {
      roleIds: ['role-1', 'role-2'],
    };

    it('should assign roles successfully', async () => {
      authRepository.findCompanyUser.mockResolvedValue(mockCompanyUser as any);
      authRepository.findRolesByIds.mockResolvedValue([mockRole, mockRole2] as any);
      authRepository.findUserRolesByCompanyUserId.mockResolvedValue([] as any);

      const result = await service.assignRoles('user-1', 'company-1', 'admin-1', assignDto);

      expect(result.success).toBe(true);
      expect(authRepository.createUserRole).toHaveBeenCalledTimes(2);
      expect(eventEmitter.emit).toHaveBeenCalledTimes(2);
      expect(authorizationService.onUserRoleChanged).toHaveBeenCalledWith('user-1', 'company-1');
    });

    it('should throw when company user not found', async () => {
      authRepository.findCompanyUser.mockResolvedValue(null);

      await expect(
        service.assignRoles('user-1', 'company-1', 'admin-1', assignDto),
      ).rejects.toThrow(RoleNotFoundException);
    });

    it('should throw when role not found', async () => {
      authRepository.findCompanyUser.mockResolvedValue(mockCompanyUser as any);
      authRepository.findRolesByIds.mockResolvedValue([mockRole] as any);

      await expect(
        service.assignRoles('user-1', 'company-1', 'admin-1', assignDto),
      ).rejects.toThrow(RoleNotFoundException);
    });

    it('should throw when role belongs to different company', async () => {
      authRepository.findCompanyUser.mockResolvedValue(mockCompanyUser as any);
      authRepository.findRolesByIds.mockResolvedValue([
        { ...mockRole, companyId: 'other-company' },
      ] as any);

      await expect(
        service.assignRoles('user-1', 'company-1', 'admin-1', { roleIds: ['role-1'] }),
      ).rejects.toThrow(RoleNotFoundException);
    });

    it('should throw when role is inactive', async () => {
      authRepository.findCompanyUser.mockResolvedValue(mockCompanyUser as any);
      authRepository.findRolesByIds.mockResolvedValue([
        { ...mockRole, isActive: false, status: 'INACTIVE' },
      ] as any);

      await expect(
        service.assignRoles('user-1', 'company-1', 'admin-1', { roleIds: ['role-1'] }),
      ).rejects.toThrow(RoleNotActiveException);
    });

    it('should throw on duplicate assignment', async () => {
      authRepository.findCompanyUser.mockResolvedValue(mockCompanyUser as any);
      authRepository.findRolesByIds.mockResolvedValue([mockRole] as any);
      authRepository.findUserRolesByCompanyUserId.mockResolvedValue([mockUserRole] as any);

      await expect(
        service.assignRoles('user-1', 'company-1', 'admin-1', { roleIds: ['role-1'] }),
      ).rejects.toThrow(DuplicateUserRoleException);
    });

    it('should use transaction for assignment', async () => {
      authRepository.findCompanyUser.mockResolvedValue(mockCompanyUser as any);
      authRepository.findRolesByIds.mockResolvedValue([mockRole] as any);
      authRepository.findUserRolesByCompanyUserId.mockResolvedValue([] as any);

      await service.assignRoles('user-1', 'company-1', 'admin-1', { roleIds: ['role-1'] });

      expect(authRepository.$transaction).toHaveBeenCalled();
    });
  });

  describe('replaceRoles', () => {
    const replaceDto = { roleIds: ['role-1'] };

    it('should replace all roles successfully', async () => {
      authRepository.findCompanyUser.mockResolvedValue(mockCompanyUser as any);
      authRepository.findRolesByIds.mockResolvedValue([mockRole] as any);
      authRepository.findUserRolesByCompanyUserId.mockResolvedValue([mockUserRole] as any);

      const result = await service.replaceRoles('user-1', 'company-1', 'admin-1', replaceDto);

      expect(result.success).toBe(true);
      expect(authRepository.softDeleteUserRole).toHaveBeenCalledTimes(1);
      expect(authRepository.createUserRole).toHaveBeenCalledTimes(1);
      expect(authorizationService.onUserRoleChanged).toHaveBeenCalled();
    });

    it('should throw when company user not found', async () => {
      authRepository.findCompanyUser.mockResolvedValue(null);

      await expect(
        service.replaceRoles('user-1', 'company-1', 'admin-1', replaceDto),
      ).rejects.toThrow(RoleNotFoundException);
    });

    it('should throw when role is inactive', async () => {
      authRepository.findCompanyUser.mockResolvedValue(mockCompanyUser as any);
      authRepository.findRolesByIds.mockResolvedValue([
        { ...mockRole, isActive: false, status: 'ARCHIVED' },
      ] as any);

      await expect(
        service.replaceRoles('user-1', 'company-1', 'admin-1', replaceDto),
      ).rejects.toThrow(RoleNotActiveException);
    });

    it('should use transaction', async () => {
      authRepository.findCompanyUser.mockResolvedValue(mockCompanyUser as any);
      authRepository.findRolesByIds.mockResolvedValue([mockRole] as any);
      authRepository.findUserRolesByCompanyUserId.mockResolvedValue([mockUserRole] as any);

      await service.replaceRoles('user-1', 'company-1', 'admin-1', replaceDto);

      expect(authRepository.$transaction).toHaveBeenCalled();
    });
  });

  describe('removeRole', () => {
    it('should remove a role successfully', async () => {
      authRepository.findCompanyUser.mockResolvedValue(mockCompanyUser as any);
      authRepository.findActiveUserRoleByCompanyUserAndRoleId.mockResolvedValue(
        mockUserRole2 as any,
      );
      authRepository.countActiveUserRolesByCompanyUser.mockResolvedValue(2);

      const result = await service.removeRole('user-1', 'role-2', 'company-1', 'admin-1');

      expect(result.success).toBe(true);
      expect(authRepository.softDeleteUserRole).toHaveBeenCalledWith('ur-2');
      expect(eventEmitter.emit).toHaveBeenCalled();
      expect(authorizationService.onUserRoleChanged).toHaveBeenCalled();
    });

    it('should throw when user role not found', async () => {
      authRepository.findCompanyUser.mockResolvedValue(mockCompanyUser as any);
      authRepository.findActiveUserRoleByCompanyUserAndRoleId.mockResolvedValue(null);

      await expect(service.removeRole('user-1', 'role-1', 'company-1', 'admin-1')).rejects.toThrow(
        UserRoleNotFoundException,
      );
    });

    it('should throw when removing primary role', async () => {
      authRepository.findCompanyUser.mockResolvedValue(mockCompanyUser as any);
      authRepository.findActiveUserRoleByCompanyUserAndRoleId.mockResolvedValue(
        mockUserRole as any,
      );

      await expect(service.removeRole('user-1', 'role-1', 'company-1', 'admin-1')).rejects.toThrow(
        CannotRemovePrimaryRoleException,
      );
    });

    it('should throw when removing the last active role', async () => {
      authRepository.findCompanyUser.mockResolvedValue(mockCompanyUser as any);
      authRepository.findActiveUserRoleByCompanyUserAndRoleId.mockResolvedValue(
        mockUserRole2 as any,
      );
      authRepository.countActiveUserRolesByCompanyUser.mockResolvedValue(1);

      await expect(service.removeRole('user-1', 'role-2', 'company-1', 'admin-1')).rejects.toThrow(
        CannotRemoveLastActiveRoleException,
      );
    });

    it('should enforce company isolation', async () => {
      authRepository.findCompanyUser.mockResolvedValue(null);

      await expect(
        service.removeRole('user-1', 'role-1', 'wrong-company', 'admin-1'),
      ).rejects.toThrow(RoleNotFoundException);
    });
  });

  describe('updateUserRoleStatus', () => {
    const deactivateDto = { status: 'INACTIVE' as const };
    const activateDto = { status: 'ACTIVE' as const };

    it('should deactivate a role successfully', async () => {
      authRepository.findCompanyUser.mockResolvedValue(mockCompanyUser as any);
      authRepository.findActiveUserRoleByCompanyUserAndRoleId.mockResolvedValue(
        mockUserRole2 as any,
      );
      authRepository.countActiveUserRolesByCompanyUser.mockResolvedValue(2);
      authRepository.updateUserRole.mockResolvedValue({
        ...mockUserRole2,
        status: 'INACTIVE',
        isActive: false,
        role: mockRole2,
      } as any);

      const result = await service.updateUserRoleStatus(
        'user-1',
        'role-2',
        'company-1',
        'admin-1',
        deactivateDto,
      );

      expect(result.success).toBe(true);
      expect(authRepository.updateUserRole).toHaveBeenCalledWith('ur-2', {
        status: 'INACTIVE',
        isActive: false,
      });
    });

    it('should throw when deactivating the last active role', async () => {
      authRepository.findCompanyUser.mockResolvedValue(mockCompanyUser as any);
      authRepository.findActiveUserRoleByCompanyUserAndRoleId.mockResolvedValue(
        mockUserRole2 as any,
      );
      authRepository.countActiveUserRolesByCompanyUser.mockResolvedValue(1);

      await expect(
        service.updateUserRoleStatus('user-1', 'role-2', 'company-1', 'admin-1', deactivateDto),
      ).rejects.toThrow(CannotRemoveLastActiveRoleException);
    });

    it('should activate a role successfully', async () => {
      authRepository.findCompanyUser.mockResolvedValue(mockCompanyUser as any);
      authRepository.findActiveUserRoleByCompanyUserAndRoleId.mockResolvedValue(
        mockUserRole2 as any,
      );
      authRepository.updateUserRole.mockResolvedValue({
        ...mockUserRole2,
        status: 'ACTIVE',
        isActive: true,
        role: mockRole2,
      } as any);

      const result = await service.updateUserRoleStatus(
        'user-1',
        'role-2',
        'company-1',
        'admin-1',
        activateDto,
      );

      expect(result.success).toBe(true);
      expect(authRepository.updateUserRole).toHaveBeenCalledWith('ur-2', {
        status: 'ACTIVE',
        isActive: true,
      });
    });

    it('should throw when user role not found', async () => {
      authRepository.findCompanyUser.mockResolvedValue(mockCompanyUser as any);
      authRepository.findActiveUserRoleByCompanyUserAndRoleId.mockResolvedValue(null);

      await expect(
        service.updateUserRoleStatus('user-1', 'role-1', 'company-1', 'admin-1', deactivateDto),
      ).rejects.toThrow(UserRoleNotFoundException);
    });
  });

  describe('updateUserRole', () => {
    it('should update a user role successfully', async () => {
      authRepository.findCompanyUser.mockResolvedValue(mockCompanyUser as any);
      authRepository.findActiveUserRoleByCompanyUserAndRoleId.mockResolvedValue(
        mockUserRole as any,
      );
      authRepository.updateUserRole.mockResolvedValue({
        ...mockUserRole,
        priority: 5,
        role: mockRole,
      } as any);

      const result = await service.updateUserRole('user-1', 'role-1', 'company-1', 'admin-1', {
        priority: 5,
      });

      expect(result.success).toBe(true);
      expect(authRepository.updateUserRole).toHaveBeenCalled();
      expect(eventEmitter.emit).toHaveBeenCalled();
      expect(authorizationService.onUserRoleChanged).toHaveBeenCalled();
    });

    it('should set primary role and clear others', async () => {
      authRepository.findCompanyUser.mockResolvedValue(mockCompanyUser as any);
      authRepository.findActiveUserRoleByCompanyUserAndRoleId.mockResolvedValue(
        mockUserRole2 as any,
      );
      authRepository.setPrimaryRole.mockResolvedValue([{ count: 1 }, { count: 1 }] as any);
      authRepository.updateUserRole.mockResolvedValue({
        ...mockUserRole2,
        isPrimaryRole: true,
        role: mockRole2,
      } as any);

      const result = await service.updateUserRole('user-1', 'role-2', 'company-1', 'admin-1', {
        isPrimaryRole: true,
      });

      expect(result.success).toBe(true);
      expect(authRepository.setPrimaryRole).toHaveBeenCalledWith('cu-1', 'ur-2');
    });
  });
});
