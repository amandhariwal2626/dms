import { Test, type TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import type { User, EmailVerificationToken, Role } from '@prisma/client';
import { InvitationService } from './invitation.service';
import { AuthRepository } from '../repositories/auth.repository';
import { HashService } from './hash.service';
import {
  UserInvitationCreatedEvent,
  UserInvitationAcceptedEvent,
  UserInvitationCancelledEvent,
} from '../events/invitation.events';
import {
  InvalidTokenException,
  TooManyAttemptsException,
  UserNotFoundException,
} from '../exceptions/auth.exceptions';
import { DuplicateInvitationException } from './invitation.service';
import type { CreateInvitationDto } from '../dto/invitation.dto';

describe('InvitationService', () => {
  let service: InvitationService;
  let authRepository: jest.Mocked<AuthRepository>;
  let hashService: jest.Mocked<HashService>;
  let eventEmitter: jest.Mocked<EventEmitter2>;

  const mockUser: User = {
    id: 'user-id-1',
    email: 'john@example.com',
    normalizedEmail: 'john@example.com',
    username: 'john',
    normalizedUsername: 'john',
    mobileNumber: '+919876543210',
    alternateMobileNumber: null,
    firstName: 'John',
    middleName: null,
    lastName: 'Doe',
    displayName: 'John Doe',
    profilePhotoUrl: null,
    gender: 'MALE',
    dateOfBirth: new Date('1990-01-01'),
    bloodGroup: 'O+',
    maritalStatus: 'SINGLE',
    nationality: 'Indian',
    preferredLanguage: 'EN',
    timezone: 'ASIA_KOLKATA',
    preferredCommunicationChannel: 'EMAIL',
    passwordHash: 'hashed-password',
    passwordChangedAt: null,
    emailVerified: true,
    emailVerifiedAt: null,
    mobileVerified: true,
    mobileVerifiedAt: null,
    twoFactorEnabled: false,
    twoFactorSecret: null,
    passwordResetRequired: false,
    forcePasswordChange: false,
    refreshTokenVersion: 0,
    securityStamp: null,
    lastLoginAt: null,
    lastLoginIp: null,
    lastLoginUserAgent: null,
    lastLoginDevice: null,
    failedLoginAttempts: 0,
    lockUntil: null,
    lastPasswordResetAt: null,
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

  const mockInvitation: EmailVerificationToken = {
    id: 'inv-id-1',
    email: 'newuser@example.com',
    token: 'invitation-token-123',
    otp: null,
    purpose: 'INVITE',
    tokenType: 'EMAIL_LINK',
    expiresAt: new Date('2099-01-01'),
    verifiedAt: null,
    attemptCount: 0,
    maxAttempts: 5,
    resendCount: 0,
    lastResendAt: null,
    ipAddress: null,
    userAgent: null,
    deviceId: null,
    browser: null,
    platform: null,
    country: null,
    state: null,
    city: null,
    failureReason: null,
    status: 'PENDING',
    isUsed: false,
    usedAt: null,
    metadata: {
      invitedBy: 'inviter-id',
      companyId: 'company-id-1',
      firstName: 'New',
      lastName: 'User',
      designation: 'Developer',
      department: 'SALES',
      roleIds: ['role-id-1'],
      message: null,
    },
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    createdBy: null,
    updatedBy: null,
    deletedAt: null,
    deletedBy: null,
    isDeleted: false,
    version: 1,
  };

  const mockRole: Role = {
    id: 'role-id-1',
    companyId: 'company-id-1',
    name: 'Admin',
    code: 'COMPANY_ADMIN',
    displayName: 'Company Admin',
    description: null,
    roleType: 'DEFAULT',
    parentRoleId: null,
    hierarchyLevel: 1,
    priority: 1,
    isSystemRole: true,
    isEditable: false,
    isDeletable: false,
    isAssignable: true,
    isActive: true,
    status: 'ACTIVE',
    defaultLandingPage: null,
    defaultModule: null,
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

  const mockRoles = [mockRole];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvitationService,
        {
          provide: AuthRepository,
          useValue: {
            findUserByEmail: jest.fn(),
            companyUserExists: jest.fn(),
            findPendingInvitation: jest.fn(),
            findRolesByIds: jest.fn(),
            createVerificationToken: jest.fn(),
            getNextEmployeeCode: jest.fn(),
            $transaction: jest.fn(),
            createActivityLog: jest.fn(),
            findInvitationByToken: jest.fn(),
            updateVerificationToken: jest.fn(),
            findInvitationById: jest.fn(),
            findInvitationsByCompany: jest.fn(),
            createUser: jest.fn(),
            updateUser: jest.fn(),
          },
        },
        {
          provide: HashService,
          useValue: {
            generateRandomToken: jest.fn().mockReturnValue('random-token-abc'),
          },
        },
        {
          provide: EventEmitter2,
          useValue: {
            emit: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<InvitationService>(InvitationService);
    authRepository = module.get(AuthRepository);
    hashService = module.get(HashService);
    eventEmitter = module.get(EventEmitter2);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ─── Create Invitation ────────────────────────

  describe('createInvitation', () => {
    const createDto: CreateInvitationDto = {
      email: 'newuser@example.com',
      firstName: 'New',
      lastName: 'User',
      designation: 'Developer',
      department: 'SALES',
      roleIds: ['role-id-1'],
      message: 'Welcome to the team!',
    };

    it('should create invitation for new user', async () => {
      authRepository.findUserByEmail.mockResolvedValue(null);
      authRepository.findPendingInvitation.mockResolvedValue(null);
      authRepository.findRolesByIds.mockResolvedValue(mockRoles);
      authRepository.createVerificationToken.mockResolvedValue(mockInvitation);
      authRepository.createActivityLog.mockResolvedValue({} as never);

      const result = await service.createInvitation('inviter-id', 'company-id-1', createDto);

      expect(result.success).toBe(true);
      expect(result.data?.invitationId).toBe('inv-id-1');
      expect(result.data?.isNewUser).toBe(true);
      expect(hashService.generateRandomToken).toHaveBeenCalled();
      expect(authRepository.createVerificationToken).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'newuser@example.com',
          purpose: 'INVITE',
        }),
      );
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'user.invitation.created',
        expect.any(UserInvitationCreatedEvent),
      );
    });

    it('should create invitation for existing user with company membership', async () => {
      authRepository.findUserByEmail.mockResolvedValue(mockUser);
      authRepository.companyUserExists.mockResolvedValue(null);
      authRepository.findPendingInvitation.mockResolvedValue(null);
      authRepository.findRolesByIds.mockResolvedValue(mockRoles);
      authRepository.createVerificationToken.mockResolvedValue(mockInvitation);
      authRepository.getNextEmployeeCode.mockResolvedValue('EMP000002');
      const mockTx = {
        companyUser: { create: jest.fn().mockResolvedValue({ id: 'cu-new-id' }) },
        userRole: { create: jest.fn().mockResolvedValue({}) },
      } as never;
      authRepository.$transaction.mockImplementation(
        (fn: (tx: never) => Promise<unknown>) => fn(mockTx) as never,
      );
      authRepository.createActivityLog.mockResolvedValue({} as never);

      const result = await service.createInvitation('inviter-id', 'company-id-1', createDto);

      expect(result.success).toBe(true);
      expect(result.data?.isNewUser).toBe(false);
      expect(authRepository.$transaction).toHaveBeenCalled();
    });

    it('should reject if user is already a member', async () => {
      authRepository.findUserByEmail.mockResolvedValue(mockUser);
      authRepository.companyUserExists.mockResolvedValue({ id: 'existing-cu' } as never);
      authRepository.findPendingInvitation.mockResolvedValue(null);

      await expect(
        service.createInvitation('inviter-id', 'company-id-1', createDto),
      ).rejects.toThrow('User is already a member of this company');
    });

    it('should reject duplicate active invitation', async () => {
      authRepository.findUserByEmail.mockResolvedValue(null);
      authRepository.findPendingInvitation.mockResolvedValue(mockInvitation);

      await expect(
        service.createInvitation('inviter-id', 'company-id-1', createDto),
      ).rejects.toThrow(DuplicateInvitationException);
    });

    it('should filter to valid role IDs only', async () => {
      authRepository.findUserByEmail.mockResolvedValue(null);
      authRepository.findPendingInvitation.mockResolvedValue(null);
      authRepository.findRolesByIds.mockResolvedValue([mockRole]);
      authRepository.createVerificationToken.mockResolvedValue(mockInvitation);
      authRepository.createActivityLog.mockResolvedValue({} as never);

      await service.createInvitation(
        'inviter-id',
        'company-id-1',
        Object.assign({}, createDto, {
          roleIds: ['role-id-1', 'nonexistent-role'],
        }),
      );

      const createCall = authRepository.createVerificationToken.mock.calls[0]?.[0];
      const metadata = createCall?.metadata as Record<string, unknown> | undefined;
      expect(metadata?.roleIds).toEqual(['role-id-1']);
    });

    it('should log activity on creation', async () => {
      authRepository.findUserByEmail.mockResolvedValue(null);
      authRepository.findPendingInvitation.mockResolvedValue(null);
      authRepository.findRolesByIds.mockResolvedValue(mockRoles);
      authRepository.createVerificationToken.mockResolvedValue(mockInvitation);
      authRepository.createActivityLog.mockResolvedValue({} as never);

      await service.createInvitation('inviter-id', 'company-id-1', createDto);

      expect(authRepository.createActivityLog).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'User Invited',
          activityType: 'DATA_CREATE',
          module: 'AUTH',
        }),
      );
    });
  });

  // ─── Accept Invitation ────────────────────────

  describe('acceptInvitation', () => {
    it('should accept invitation for new user', async () => {
      authRepository.findInvitationByToken.mockResolvedValue(mockInvitation);
      authRepository.findUserByEmail.mockResolvedValue(null);
      authRepository.getNextEmployeeCode.mockResolvedValue('EMP000001');
      authRepository.createUser.mockResolvedValue(
        Object.assign({}, mockUser, { id: 'new-user-id' }),
      );
      const txMock1 = {
        companyUser: { create: jest.fn().mockResolvedValue({ id: 'cu-new-id' }) },
        role: { findUnique: jest.fn().mockResolvedValue(mockRole) },
        userRole: { create: jest.fn().mockResolvedValue({}) },
        emailVerificationToken: { update: jest.fn().mockResolvedValue({}) },
      } as never;
      authRepository.$transaction.mockImplementation(
        (fn: (tx: never) => Promise<unknown>) => fn(txMock1) as never,
      );
      authRepository.createActivityLog.mockResolvedValue({} as never);

      const result = await service.acceptInvitation('invitation-token-123');

      expect(result.success).toBe(true);
      expect(authRepository.$transaction).toHaveBeenCalled();
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'user.invitation.accepted',
        expect.any(UserInvitationAcceptedEvent),
      );
    });

    it('should accept invitation for existing user', async () => {
      authRepository.findInvitationByToken.mockResolvedValue(mockInvitation);
      authRepository.findUserByEmail.mockResolvedValue(mockUser);
      authRepository.getNextEmployeeCode.mockResolvedValue('EMP000002');
      const txMock2 = {
        companyUser: { create: jest.fn().mockResolvedValue({ id: 'cu-new-id' }) },
        role: { findUnique: jest.fn().mockResolvedValue(mockRole) },
        userRole: { create: jest.fn().mockResolvedValue({}) },
        emailVerificationToken: { update: jest.fn().mockResolvedValue({}) },
      } as never;
      authRepository.$transaction.mockImplementation(
        (fn: (tx: never) => Promise<unknown>) => fn(txMock2) as never,
      );
      authRepository.updateUser.mockResolvedValue({} as never);
      authRepository.createActivityLog.mockResolvedValue({} as never);

      const result = await service.acceptInvitation('invitation-token-123');

      expect(result.success).toBe(true);
      expect(authRepository.updateUser).toHaveBeenCalledWith('user-id-1', {
        forcePasswordChange: true,
      });
    });

    it('should reject invalid token', async () => {
      authRepository.findInvitationByToken.mockResolvedValue(null);

      await expect(service.acceptInvitation('bad-token')).rejects.toThrow(InvalidTokenException);
    });

    it('should reject already used token', async () => {
      authRepository.findInvitationByToken.mockResolvedValue({
        ...mockInvitation,
        status: 'VERIFIED',
        isUsed: true,
      });

      await expect(service.acceptInvitation('used-token')).rejects.toThrow(InvalidTokenException);
    });

    it('should reject expired token', async () => {
      authRepository.findInvitationByToken.mockResolvedValue({
        ...mockInvitation,
        expiresAt: new Date('2020-01-01'),
      });

      await expect(service.acceptInvitation('expired-token')).rejects.toThrow(
        InvalidTokenException,
      );
      expect(authRepository.updateVerificationToken).toHaveBeenCalledWith(
        'inv-id-1',
        expect.objectContaining({ status: 'EXPIRED' }),
      );
    });
  });

  // ─── Resend Invitation ────────────────────────

  describe('resendInvitation', () => {
    it('should resend invitation with new token', async () => {
      authRepository.findInvitationById.mockResolvedValue(mockInvitation);
      authRepository.updateVerificationToken.mockResolvedValue({} as never);
      authRepository.createActivityLog.mockResolvedValue({} as never);

      const result = await service.resendInvitation('inv-id-1', 'user-id-1');

      expect(result.success).toBe(true);
      expect(authRepository.updateVerificationToken).toHaveBeenCalledWith(
        'inv-id-1',
        expect.objectContaining({
          resendCount: 1,
        }),
      );
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'user.invitation.created',
        expect.any(UserInvitationCreatedEvent),
      );
    });

    it('should reject resend for non-existent invitation', async () => {
      authRepository.findInvitationById.mockResolvedValue(null);

      await expect(service.resendInvitation('bad-id', 'user-id')).rejects.toThrow(
        UserNotFoundException,
      );
    });

    it('should reject resend past max limit', async () => {
      authRepository.findInvitationById.mockResolvedValue({
        ...mockInvitation,
        resendCount: 5,
      });

      await expect(service.resendInvitation('inv-id-1', 'user-id')).rejects.toThrow(
        TooManyAttemptsException,
      );
    });

    it('should increment resend count', async () => {
      authRepository.findInvitationById.mockResolvedValue({
        ...mockInvitation,
        resendCount: 3,
      });
      authRepository.updateVerificationToken.mockResolvedValue({} as never);
      authRepository.createActivityLog.mockResolvedValue({} as never);

      await service.resendInvitation('inv-id-1', 'user-id-1');

      expect(authRepository.updateVerificationToken).toHaveBeenCalledWith(
        'inv-id-1',
        expect.objectContaining({ resendCount: 4 }),
      );
    });
  });

  // ─── Cancel Invitation ────────────────────────

  describe('cancelInvitation', () => {
    it('should cancel invitation', async () => {
      authRepository.findInvitationById.mockResolvedValue(mockInvitation);
      authRepository.updateVerificationToken.mockResolvedValue({} as never);
      authRepository.createActivityLog.mockResolvedValue({} as never);

      const result = await service.cancelInvitation('inv-id-1', 'user-id-1');

      expect(result.success).toBe(true);
      expect(authRepository.updateVerificationToken).toHaveBeenCalledWith(
        'inv-id-1',
        expect.objectContaining({ status: 'EXPIRED' }),
      );
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'user.invitation.cancelled',
        expect.any(UserInvitationCancelledEvent),
      );
    });

    it('should reject cancel for non-existent invitation', async () => {
      authRepository.findInvitationById.mockResolvedValue(null);

      await expect(service.cancelInvitation('bad-id', 'user-id')).rejects.toThrow(
        UserNotFoundException,
      );
    });

    it('should reject cancel for already accepted invitation', async () => {
      authRepository.findInvitationById.mockResolvedValue({
        ...mockInvitation,
        isUsed: true,
        status: 'VERIFIED',
      });

      await expect(service.cancelInvitation('inv-id-1', 'user-id-1')).rejects.toThrow(
        'Cannot cancel an already accepted invitation',
      );
    });
  });

  // ─── List Invitations ─────────────────────────

  describe('listInvitations', () => {
    it('should list invitations for company', async () => {
      authRepository.findInvitationsByCompany.mockResolvedValue([mockInvitation]);

      const result = await service.listInvitations('company-id-1');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0]?.email).toBe('newuser@example.com');
    });

    it('should return empty array if no invitations', async () => {
      authRepository.findInvitationsByCompany.mockResolvedValue([]);

      const result = await service.listInvitations('company-id-1');

      expect(result.data).toHaveLength(0);
    });
  });

  // ─── Get Invitation ───────────────────────────

  describe('getInvitation', () => {
    it('should return invitation details', async () => {
      authRepository.findInvitationById.mockResolvedValue(mockInvitation);

      const result = await service.getInvitation('inv-id-1');

      expect(result.success).toBe(true);
      expect(result.data.email).toBe('newuser@example.com');
      expect(result.data.status).toBe('PENDING');
    });

    it('should reject non-existent invitation', async () => {
      authRepository.findInvitationById.mockResolvedValue(null);

      await expect(service.getInvitation('bad-id')).rejects.toThrow(UserNotFoundException);
    });
  });
});
