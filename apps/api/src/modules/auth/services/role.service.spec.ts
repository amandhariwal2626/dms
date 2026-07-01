import { Test, type TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import type { Role } from '@prisma/client';
import { RoleService } from './role.service';
import { AuthRepository } from '../repositories/auth.repository';
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
import type { CreateRoleDto, UpdateRoleDto, RoleQueryDto } from '../dto/role.dto';

describe('RoleService', () => {
  let service: RoleService;
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

  const mockSystemRole: Role = {
    ...mockRole,
    id: 'system-role-id',
    name: 'System Admin',
    code: 'SYSTEM_ADMIN',
    roleType: 'SYSTEM',
    isSystemRole: true,
    isEditable: false,
    isDeletable: false,
  };

  const mockAdminRole: Role = {
    ...mockRole,
    id: 'admin-role-id',
    name: 'Company Admin',
    code: 'COMPANY_ADMIN',
    roleType: 'DEFAULT',
    isSystemRole: false,
    isEditable: false,
    isDeletable: false,
  };

  const mockParentRole: Role = {
    ...mockRole,
    id: 'parent-role-id',
    name: 'Manager',
    code: 'MANAGER',
  };

  const mockRoleWithDetails = {
    ...mockRole,
    parentRole: null,
    childRoles: [{ id: 'child-1' }, { id: 'child-2' }],
    _count: { userRoles: 5 },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoleService,
        {
          provide: AuthRepository,
          useValue: {
            findRoles: jest.fn(),
            countRoles: jest.fn(),
            findRoleWithDetails: jest.fn(),
            findRoleById: jest.fn(),
            findRoleByName: jest.fn(),
            findRoleByCode: jest.fn(),
            createRole: jest.fn(),
            updateRole: jest.fn(),
            softDeleteRole: jest.fn(),
            countActiveRoleUsers: jest.fn(),
            countActiveAdminRoles: jest.fn(),
            createActivityLog: jest.fn(),
          },
        },
        {
          provide: EventEmitter2,
          useValue: { emit: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<RoleService>(RoleService);
    authRepository = module.get(AuthRepository);
    eventEmitter = module.get(EventEmitter2);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ─── List Roles ──────────────────────────────

  describe('list', () => {
    const mockRoles = [
      mockRole,
      { ...mockRole, id: 'role-id-2', name: 'Sales Rep', code: 'SALES_REP' },
    ];
    const query: RoleQueryDto = { page: 1, limit: 10, sortBy: 'createdAt', sortOrder: 'desc' };

    it('should return paginated roles', async () => {
      authRepository.findRoles.mockResolvedValue(mockRoles);
      authRepository.countRoles.mockResolvedValue(2);

      const result = await service.list('company-id-1', query);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.meta.total).toBe(2);
      expect(result.meta.page).toBe(1);
      expect(result.meta.totalPages).toBe(1);
    });

    it('should apply search filter', async () => {
      authRepository.findRoles.mockResolvedValue([mockRole]);
      authRepository.countRoles.mockResolvedValue(1);

      await service.list('company-id-1', Object.assign({}, query, { search: 'Sales' }));

      expect(authRepository.findRoles).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ name: expect.objectContaining({ contains: 'Sales' }) }),
            ]),
          }),
        }),
      );
    });

    it('should apply status filter', async () => {
      authRepository.findRoles.mockResolvedValue([mockRole]);
      authRepository.countRoles.mockResolvedValue(1);

      await service.list('company-id-1', Object.assign({}, query, { status: 'ACTIVE' }));

      expect(authRepository.findRoles).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'ACTIVE' }),
        }),
      );
    });

    it('should apply roleType filter', async () => {
      authRepository.findRoles.mockResolvedValue([mockRole]);
      authRepository.countRoles.mockResolvedValue(1);

      await service.list('company-id-1', Object.assign({}, query, { roleType: 'CUSTOM' }));

      expect(authRepository.findRoles).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ roleType: 'CUSTOM' }),
        }),
      );
    });

    it('should return empty array when no roles found', async () => {
      authRepository.findRoles.mockResolvedValue([]);
      authRepository.countRoles.mockResolvedValue(0);

      const result = await service.list('company-id-1', query);

      expect(result.data).toHaveLength(0);
      expect(result.meta.total).toBe(0);
    });

    it('should enforce company isolation', async () => {
      authRepository.findRoles.mockResolvedValue([]);
      authRepository.countRoles.mockResolvedValue(0);

      await service.list('company-id-2', query);

      expect(authRepository.findRoles).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ companyId: 'company-id-2' }),
        }),
      );
    });
  });

  // ─── Get Role By ID ──────────────────────────

  describe('getById', () => {
    it('should return complete role details', async () => {
      authRepository.findRoleWithDetails.mockResolvedValue(mockRoleWithDetails);
      authRepository.countActiveRoleUsers.mockResolvedValue(5);

      const result = await service.getById('role-id-1', 'company-id-1');

      expect(result.success).toBe(true);
      expect(result.data.id).toBe('role-id-1');
      expect(result.data.name).toBe('Sales Manager');
      expect(result.data.parentRole).toBeNull();
      expect(result.data.childRolesCount).toBe(2);
      expect(result.data.userCount).toBe(5);
    });

    it('should throw RoleNotFoundException when role not found', async () => {
      authRepository.findRoleWithDetails.mockResolvedValue(null);

      await expect(service.getById('bad-id', 'company-id-1')).rejects.toThrow(
        RoleNotFoundException,
      );
    });

    it('should throw RoleNotFoundException when role belongs to different company', async () => {
      authRepository.findRoleWithDetails.mockResolvedValue(mockRoleWithDetails);

      await expect(service.getById('role-id-1', 'company-id-2')).rejects.toThrow(
        RoleNotFoundException,
      );
    });
  });

  // ─── Create Role ─────────────────────────────

  describe('create', () => {
    const createDto: CreateRoleDto = {
      name: 'New Role',
      code: 'NEW_ROLE',
      displayName: 'New Role Display',
      description: 'A new custom role',
      defaultLandingPage: '/dashboard',
      defaultModule: 'SALES',
    };

    it('should create a custom role', async () => {
      authRepository.findRoleByName.mockResolvedValue(null);
      authRepository.findRoleByCode.mockResolvedValue(null);
      authRepository.createRole.mockResolvedValue(mockRole);
      authRepository.createActivityLog.mockResolvedValue({} as never);

      const result = await service.create('company-id-1', 'user-1', createDto);

      expect(result.success).toBe(true);
      expect(authRepository.createRole).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'New Role',
          code: 'NEW_ROLE',
          roleType: 'CUSTOM',
          isSystemRole: false,
        }),
      );
      expect(eventEmitter.emit).toHaveBeenCalledWith('role.created', expect.any(RoleCreatedEvent));
    });

    it('should throw DuplicateRoleNameException when name exists', async () => {
      authRepository.findRoleByName.mockResolvedValue(mockRole);

      await expect(service.create('company-id-1', 'user-1', createDto)).rejects.toThrow(
        DuplicateRoleNameException,
      );
    });

    it('should throw DuplicateRoleCodeException when code exists', async () => {
      authRepository.findRoleByName.mockResolvedValue(null);
      authRepository.findRoleByCode.mockResolvedValue(mockRole);

      await expect(service.create('company-id-1', 'user-1', createDto)).rejects.toThrow(
        DuplicateRoleCodeException,
      );
    });

    it('should validate parent role belongs to the same company', async () => {
      authRepository.findRoleByName.mockResolvedValue(null);
      authRepository.findRoleByCode.mockResolvedValue(null);
      authRepository.findRoleById.mockResolvedValue(mockParentRole);
      authRepository.createRole.mockResolvedValue(mockRole);
      authRepository.createActivityLog.mockResolvedValue({} as never);

      await service.create(
        'company-id-1',
        'user-1',
        Object.assign({}, createDto, { parentRoleId: 'parent-role-id' }),
      );

      expect(authRepository.createRole).toHaveBeenCalled();
    });

    it('should throw InvalidParentRoleException for cross-company parent', async () => {
      authRepository.findRoleByName.mockResolvedValue(null);
      authRepository.findRoleByCode.mockResolvedValue(null);
      authRepository.findRoleById.mockResolvedValue(
        Object.assign({}, mockParentRole, { companyId: 'other-company' }),
      );

      await expect(
        service.create(
          'company-id-1',
          'user-1',
          Object.assign({}, createDto, { parentRoleId: 'parent-role-id' }),
        ),
      ).rejects.toThrow(InvalidParentRoleException);
    });

    it('should log activity on creation', async () => {
      authRepository.findRoleByName.mockResolvedValue(null);
      authRepository.findRoleByCode.mockResolvedValue(null);
      authRepository.createRole.mockResolvedValue(mockRole);
      authRepository.createActivityLog.mockResolvedValue({} as never);

      await service.create('company-id-1', 'user-1', createDto);

      expect(authRepository.createActivityLog).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Role Created',
          activityType: 'DATA_CREATE',
          module: 'AUTH',
        }),
      );
    });
  });

  // ─── Update Role ─────────────────────────────

  describe('update', () => {
    const updateDto: UpdateRoleDto = {
      displayName: 'Updated Display',
      description: 'Updated description',
      defaultLandingPage: '/new-dashboard',
    };

    it('should update allowed fields', async () => {
      authRepository.findRoleById.mockResolvedValue(mockRole);
      authRepository.updateRole.mockResolvedValue({ ...mockRole, displayName: 'Updated Display' });
      authRepository.createActivityLog.mockResolvedValue({} as never);

      const result = await service.update('role-id-1', 'company-id-1', 'user-1', updateDto);

      expect(result.success).toBe(true);
      expect(authRepository.updateRole).toHaveBeenCalledWith(
        'role-id-1',
        expect.objectContaining({
          displayName: 'Updated Display',
        }),
      );
      expect(eventEmitter.emit).toHaveBeenCalledWith('role.updated', expect.any(RoleUpdatedEvent));
    });

    it('should throw RoleNotFoundException when not found', async () => {
      authRepository.findRoleById.mockResolvedValue(null);

      await expect(service.update('bad-id', 'company-id-1', 'user-1', updateDto)).rejects.toThrow(
        RoleNotFoundException,
      );
    });

    it('should throw RoleNotFoundException for cross-company access', async () => {
      authRepository.findRoleById.mockResolvedValue(mockRole);

      await expect(
        service.update('role-id-1', 'company-id-2', 'user-1', updateDto),
      ).rejects.toThrow(RoleNotFoundException);
    });

    it('should throw SystemRoleModificationException for system roles', async () => {
      authRepository.findRoleById.mockResolvedValue(mockSystemRole);

      await expect(
        service.update('system-role-id', 'company-id-1', 'user-1', updateDto),
      ).rejects.toThrow(SystemRoleModificationException);
    });

    it('should validate parent role on update', async () => {
      authRepository.findRoleById.mockResolvedValue(mockRole);
      authRepository.findRoleById.mockResolvedValue(mockParentRole);
      authRepository.updateRole.mockResolvedValue(mockRole);
      authRepository.createActivityLog.mockResolvedValue({} as never);

      await service.update(
        'role-id-1',
        'company-id-1',
        'user-1',
        Object.assign({}, updateDto, {
          parentRoleId: 'parent-role-id',
        }),
      );

      expect(authRepository.updateRole).toHaveBeenCalledWith(
        'role-id-1',
        expect.objectContaining({
          parentRole: { connect: { id: 'parent-role-id' } },
        }),
      );
    });
  });

  // ─── Change Status ───────────────────────────

  describe('changeStatus', () => {
    it('should activate a role', async () => {
      authRepository.findRoleById.mockResolvedValue(mockRole);
      authRepository.updateRole.mockResolvedValue({
        ...mockRole,
        status: 'ACTIVE',
        isActive: true,
      });
      authRepository.createActivityLog.mockResolvedValue({} as never);

      const result = await service.changeStatus('role-id-1', 'company-id-1', 'user-1', {
        status: 'ACTIVE',
      });

      expect(result.success).toBe(true);
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'role.status.changed',
        expect.any(RoleStatusChangedEvent),
      );
    });

    it('should deactivate a role', async () => {
      authRepository.findRoleById.mockResolvedValue(mockRole);
      authRepository.updateRole.mockResolvedValue({
        ...mockRole,
        status: 'INACTIVE',
        isActive: false,
      });
      authRepository.createActivityLog.mockResolvedValue({} as never);

      const result = await service.changeStatus('role-id-1', 'company-id-1', 'user-1', {
        status: 'INACTIVE',
      });

      expect(result.success).toBe(true);
      expect(authRepository.createActivityLog).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Role Deactivated' }),
      );
    });

    it('should archive a role', async () => {
      authRepository.findRoleById.mockResolvedValue(mockRole);
      authRepository.updateRole.mockResolvedValue({
        ...mockRole,
        status: 'ARCHIVED',
        isActive: false,
      });
      authRepository.createActivityLog.mockResolvedValue({} as never);

      const result = await service.changeStatus('role-id-1', 'company-id-1', 'user-1', {
        status: 'ARCHIVED',
      });

      expect(result.success).toBe(true);
      expect(authRepository.createActivityLog).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Role Archived' }),
      );
    });

    it('should throw RoleNotFoundException when not found', async () => {
      authRepository.findRoleById.mockResolvedValue(null);

      await expect(
        service.changeStatus('bad-id', 'company-id-1', 'user-1', { status: 'ACTIVE' }),
      ).rejects.toThrow(RoleNotFoundException);
    });

    it('should throw CannotArchiveSystemRoleException for system roles', async () => {
      authRepository.findRoleById.mockResolvedValue(mockSystemRole);

      await expect(
        service.changeStatus('system-role-id', 'company-id-1', 'user-1', { status: 'ARCHIVED' }),
      ).rejects.toThrow(CannotArchiveSystemRoleException);
    });

    it('should throw CannotDeactivateAdminRoleException for last admin', async () => {
      authRepository.findRoleById.mockResolvedValue(mockAdminRole);
      authRepository.countActiveAdminRoles.mockResolvedValue(0);

      await expect(
        service.changeStatus('admin-role-id', 'company-id-1', 'user-1', { status: 'INACTIVE' }),
      ).rejects.toThrow(CannotDeactivateAdminRoleException);
    });

    it('should allow deactivating admin when other active admins exist', async () => {
      authRepository.findRoleById.mockResolvedValue(mockAdminRole);
      authRepository.countActiveAdminRoles.mockResolvedValue(1);
      authRepository.updateRole.mockResolvedValue({
        ...mockAdminRole,
        status: 'INACTIVE',
        isActive: false,
      });
      authRepository.createActivityLog.mockResolvedValue({} as never);

      const result = await service.changeStatus('admin-role-id', 'company-id-1', 'user-1', {
        status: 'INACTIVE',
      });

      expect(result.success).toBe(true);
    });
  });

  // ─── Clone Role ──────────────────────────────

  describe('clone', () => {
    it('should clone a role with Copy suffix', async () => {
      authRepository.findRoleById.mockResolvedValue(mockRole);
      authRepository.createRole.mockResolvedValue({
        ...mockRole,
        id: 'cloned-id',
        name: 'Sales Manager Copy',
        code: 'SALES_MANAGER_COPY',
      });
      authRepository.createActivityLog.mockResolvedValue({} as never);

      const result = await service.clone('role-id-1', 'company-id-1', 'user-1');

      expect(result.success).toBe(true);
      expect(result.data?.name).toBe('Sales Manager Copy');
      expect(authRepository.createRole).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Sales Manager Copy',
          code: 'SALES_MANAGER_COPY',
          roleType: 'CUSTOM',
          isSystemRole: false,
        }),
      );
      expect(eventEmitter.emit).toHaveBeenCalledWith('role.cloned', expect.any(RoleClonedEvent));
    });

    it('should throw RoleNotFoundException when source not found', async () => {
      authRepository.findRoleById.mockResolvedValue(null);

      await expect(service.clone('bad-id', 'company-id-1', 'user-1')).rejects.toThrow(
        RoleNotFoundException,
      );
    });

    it('should throw RoleNotFoundException for cross-company access', async () => {
      authRepository.findRoleById.mockResolvedValue(mockRole);

      await expect(service.clone('role-id-1', 'company-id-2', 'user-1')).rejects.toThrow(
        RoleNotFoundException,
      );
    });

    it('should log activity on clone', async () => {
      authRepository.findRoleById.mockResolvedValue(mockRole);
      authRepository.createRole.mockResolvedValue({
        ...mockRole,
        id: 'cloned-id',
        name: 'Sales Manager Copy',
        code: 'SALES_MANAGER_COPY',
      });
      authRepository.createActivityLog.mockResolvedValue({} as never);

      await service.clone('role-id-1', 'company-id-1', 'user-1');

      expect(authRepository.createActivityLog).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Role Cloned',
          activityType: 'DATA_CREATE',
        }),
      );
    });
  });

  // ─── Delete Role ─────────────────────────────

  describe('delete', () => {
    it('should soft delete a role', async () => {
      authRepository.findRoleById.mockResolvedValue(mockRole);
      authRepository.countActiveRoleUsers.mockResolvedValue(0);
      authRepository.softDeleteRole.mockResolvedValue({ ...mockRole, isDeleted: true });
      authRepository.createActivityLog.mockResolvedValue({} as never);

      const result = await service.delete('role-id-1', 'company-id-1', 'user-1');

      expect(result.success).toBe(true);
      expect(authRepository.softDeleteRole).toHaveBeenCalledWith('role-id-1', 'user-1');
      expect(eventEmitter.emit).toHaveBeenCalledWith('role.deleted', expect.any(RoleDeletedEvent));
    });

    it('should throw RoleNotFoundException when not found', async () => {
      authRepository.findRoleById.mockResolvedValue(null);

      await expect(service.delete('bad-id', 'company-id-1', 'user-1')).rejects.toThrow(
        RoleNotFoundException,
      );
    });

    it('should throw RoleNotFoundException for cross-company access', async () => {
      authRepository.findRoleById.mockResolvedValue(mockRole);

      await expect(service.delete('role-id-1', 'company-id-2', 'user-1')).rejects.toThrow(
        RoleNotFoundException,
      );
    });

    it('should throw SystemRoleModificationException for system roles', async () => {
      authRepository.findRoleById.mockResolvedValue(mockSystemRole);

      await expect(service.delete('system-role-id', 'company-id-1', 'user-1')).rejects.toThrow(
        SystemRoleModificationException,
      );
    });

    it('should throw CannotDeleteAdminRoleException for COMPANY_ADMIN role', async () => {
      authRepository.findRoleById.mockResolvedValue(mockAdminRole);

      await expect(service.delete('admin-role-id', 'company-id-1', 'user-1')).rejects.toThrow(
        CannotDeleteAdminRoleException,
      );
    });

    it('should throw RoleInUseException when role has active users', async () => {
      authRepository.findRoleById.mockResolvedValue(mockRole);
      authRepository.countActiveRoleUsers.mockResolvedValue(3);

      await expect(service.delete('role-id-1', 'company-id-1', 'user-1')).rejects.toThrow(
        RoleInUseException,
      );
    });

    it('should log activity on deletion', async () => {
      authRepository.findRoleById.mockResolvedValue(mockRole);
      authRepository.countActiveRoleUsers.mockResolvedValue(0);
      authRepository.softDeleteRole.mockResolvedValue({ ...mockRole, isDeleted: true });
      authRepository.createActivityLog.mockResolvedValue({} as never);

      await service.delete('role-id-1', 'company-id-1', 'user-1');

      expect(authRepository.createActivityLog).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Role Deleted',
          activityType: 'DATA_DELETE',
        }),
      );
    });
  });
});
