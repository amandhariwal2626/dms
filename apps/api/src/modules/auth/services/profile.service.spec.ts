import { Test, type TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import type { User } from '@prisma/client';
import { ProfileService } from './profile.service';
import { PasswordService } from './password.service';
import { AuthRepository } from '../repositories/auth.repository';
import {
  ProfileUpdatedEvent,
  ProfilePhotoUploadedEvent,
  PreferencesUpdatedEvent,
} from '../events/profile.events';
import { PasswordChangedEvent } from '../events/auth.events';
import {
  InvalidCredentialsException,
  WeakPasswordException,
  PasswordMismatchException,
  InvalidFileException,
  FileTooLargeException,
} from '../exceptions/auth.exceptions';

jest.mock('fs/promises', () => ({
  mkdir: jest.fn().mockResolvedValue(undefined),
  writeFile: jest.fn().mockResolvedValue(undefined),
}));

describe('ProfileService', () => {
  let service: ProfileService;
  let passwordService: jest.Mocked<PasswordService>;
  let authRepository: jest.Mocked<AuthRepository>;
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

  const mockCompanyUser = {
    id: 'cu-id-1',
    companyId: 'company-id-1',
    userId: 'user-id-1',
    employeeCode: 'EMP000001',
    officialEmail: 'john@example.com',
    officialMobileNumber: null,
    designation: 'Manager',
    department: 'SALES',
    jobTitle: null,
    employmentType: null,
    employmentStatus: 'ACTIVE',
    joiningDate: new Date('2024-01-01'),
    confirmationDate: null,
    relievingDate: null,
    experienceInYears: null,
    reportingManagerId: null,
    isReportingManager: false,
    isPrimaryCompany: true,
    isDefaultCompany: true,
    canSwitchCompany: true,
    defaultWarehouseId: null,
    defaultRouteId: null,
    defaultBeatId: null,
    defaultSalesRegionId: null,
    defaultPriceListId: null,
    workLocation: 'Mumbai',
    costCenter: null,
    businessUnit: null,
    division: null,
    salesRegion: null,
    zone: null,
    territory: null,
    cluster: null,
    canApproveOrders: false,
    canApproveReturns: false,
    canApprovePurchases: false,
    canApprovePayments: false,
    approvalLimit: null,
    lastCompanyLoginAt: null,
    lastCompanyLoginIp: null,
    lastCompanyLoginDevice: null,
    invitedBy: null,
    invitedAt: null,
    acceptedInvitationAt: null,
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
    company: {
      id: 'company-id-1',
      companyCode: 'CMP000001',
      legalName: 'Acme Corp',
      displayName: 'Acme Corp Pvt Ltd',
      logoUrl: '/logos/acme.png',
      email: 'info@acme.com',
      phone: null,
      businessType: 'PRIVATE_LIMITED',
      companyCategory: 'DISTRIBUTOR',
      gstNumber: null,
      panNumber: null,
      cinNumber: null,
      gstType: null,
      gstFileStatus: null,
      registrationDate: null,
      taxProfile: null,
      subscriptionPlan: 'PROFESSIONAL',
      subscriptionStatus: 'ACTIVE',
      subscriptionStartDate: null,
      subscriptionEndDate: null,
      maxUsers: null,
      maxStorageGb: null,
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
    userRoles: [
      {
        id: 'ur-id-1',
        companyUserId: 'cu-id-1',
        roleId: 'role-id-1',
        assignedBy: 'admin-id',
        source: 'SELF_ONBOARDING',
        scope: 'COMPANY',
        effectiveFrom: null,
        effectiveTo: null,
        isPrimaryRole: true,
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
        role: {
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
      },
    ],
  };

  const mockUserWithProfile = {
    ...mockUser,
    companyUsers: [mockCompanyUser],
  };

  const mockSession = {
    id: 'session-id-1',
    loginAt: new Date('2024-01-01T10:00:00Z'),
    lastActivityAt: new Date('2024-01-01T12:00:00Z'),
    deviceName: 'iPhone 15',
    browser: 'Safari',
    operatingSystem: 'iOS 18',
  };

  const mockFile = {
    buffer: Buffer.from('fake-image-data'),
    mimetype: 'image/jpeg',
    size: 1024 * 1024,
    originalname: 'photo.jpg',
  };

  const mockTx = {
    user: { update: jest.fn().mockResolvedValue({}) },
    session: { updateMany: jest.fn().mockResolvedValue({ count: 2 }) },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfileService,
        {
          provide: PasswordService,
          useValue: {
            hashPassword: jest.fn(),
            verifyPassword: jest.fn(),
            validatePasswordStrength: jest.fn(),
            generateTemporaryPassword: jest.fn(),
          },
        },
        {
          provide: AuthRepository,
          useValue: {
            findUserWithProfile: jest.fn(),
            findCurrentSession: jest.fn(),
            updateUser: jest.fn(),
            createActivityLog: jest.fn(),
            createFileAttachment: jest.fn(),
            $transaction: jest.fn(),
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

    service = module.get<ProfileService>(ProfileService);
    passwordService = module.get(PasswordService);
    authRepository = module.get(AuthRepository);
    eventEmitter = module.get(EventEmitter2);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ─── Get Profile ───────────────────────────────────

  describe('getProfile', () => {
    it('should return complete profile with all sections', async () => {
      authRepository.findUserWithProfile.mockResolvedValue(mockUserWithProfile as never);
      authRepository.findCurrentSession.mockResolvedValue(mockSession as never);

      const result = await service.getProfile(
        'user-id-1',
        'session-id-1',
        'company-id-1',
        'cu-id-1',
      );

      expect(result.id).toBe('user-id-1');
      expect(result.firstName).toBe('John');
      expect(result.email).toBe('john@example.com');
      expect(result.emailVerified).toBe(true);
      expect(result.mobileVerified).toBe(true);

      expect(result.activeCompany).toEqual({
        companyId: 'company-id-1',
        companyCode: 'CMP000001',
        legalName: 'Acme Corp',
        displayName: 'Acme Corp Pvt Ltd',
        logoUrl: '/logos/acme.png',
      });

      expect(result.companyMembership).toEqual({
        companyUserId: 'cu-id-1',
        employeeCode: 'EMP000001',
        designation: 'Manager',
        department: 'SALES',
        joiningDate: expect.any(String),
        employmentStatus: 'ACTIVE',
        workLocation: 'Mumbai',
      });

      expect(result.roles).toHaveLength(1);
      expect(result.roles[0]).toEqual({
        roleId: 'role-id-1',
        name: 'Admin',
        code: 'COMPANY_ADMIN',
      });

      expect(result.currentSession).toEqual({
        sessionId: 'session-id-1',
        loginAt: expect.any(String),
        lastActivityAt: expect.any(String),
        deviceName: 'iPhone 15',
        browser: 'Safari',
        operatingSystem: 'iOS 18',
      });
    });

    it('should return null sections when no session or company context', async () => {
      authRepository.findUserWithProfile.mockResolvedValue(mockUserWithProfile as never);

      const result = await service.getProfile('user-id-1');

      expect(result.activeCompany).toBeNull();
      expect(result.companyMembership).toBeNull();
      expect(result.roles).toEqual([]);
      expect(result.currentSession).toBeNull();
    });

    it('should throw InvalidCredentialsException when user not found', async () => {
      authRepository.findUserWithProfile.mockResolvedValue(null);

      await expect(service.getProfile('non-existent-id')).rejects.toThrow(
        InvalidCredentialsException,
      );
    });

    it('should not include passwordHash in response', async () => {
      authRepository.findUserWithProfile.mockResolvedValue(mockUserWithProfile as never);
      authRepository.findCurrentSession.mockResolvedValue(mockSession as never);

      const result = await service.getProfile('user-id-1', 'session-id-1');

      expect(result).not.toHaveProperty('passwordHash');
      expect(result).not.toHaveProperty('securityStamp');
      expect(result).not.toHaveProperty('refreshTokenVersion');
    });
  });

  // ─── Update Profile ────────────────────────────────

  describe('updateProfile', () => {
    it('should update allowed fields', async () => {
      authRepository.updateUser.mockResolvedValue({} as never);

      const result = await service.updateProfile('user-id-1', {
        firstName: 'Jane',
        lastName: 'Smith',
        displayName: 'Jane Smith',
      });

      expect(result).toEqual({
        success: true,
        message: 'Profile updated successfully',
      });
      expect(authRepository.updateUser).toHaveBeenCalledWith('user-id-1', {
        firstName: 'Jane',
        lastName: 'Smith',
        displayName: 'Jane Smith',
      });
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        ProfileUpdatedEvent.eventName,
        expect.any(ProfileUpdatedEvent),
      );
      expect(authRepository.createActivityLog).toHaveBeenCalled();
    });

    it('should return early when no fields provided', async () => {
      const result = await service.updateProfile('user-id-1', {});

      expect(result).toEqual({
        success: true,
        message: 'No fields to update',
      });
      expect(authRepository.updateUser).not.toHaveBeenCalled();
    });

    it('should not update restricted fields like email or username', async () => {
      authRepository.updateUser.mockResolvedValue({} as never);

      await service.updateProfile('user-id-1', {
        firstName: 'Jane',
      });

      const updateCall = (authRepository.updateUser as jest.Mock).mock.calls[0][1];
      expect(updateCall).not.toHaveProperty('email');
      expect(updateCall).not.toHaveProperty('username');
      expect(updateCall).not.toHaveProperty('status');
    });
  });

  // ─── Change Password ───────────────────────────────

  describe('changePassword', () => {
    const changePwdDto = {
      currentPassword: 'OldPass1!',
      newPassword: 'NewStrongPass1!',
      confirmPassword: 'NewStrongPass1!',
      logoutOtherDevices: false,
    };

    it('should change password successfully', async () => {
      authRepository.findUserWithProfile.mockResolvedValue(mockUserWithProfile as never);
      passwordService.verifyPassword.mockResolvedValue(true);
      passwordService.validatePasswordStrength.mockReturnValue({
        isValid: true,
        errors: [],
      });
      passwordService.hashPassword.mockResolvedValue('new-hashed-password');
      authRepository.$transaction.mockImplementation((fn: (tx: never) => Promise<unknown>) =>
        fn(mockTx as never),
      );

      const result = await service.changePassword('user-id-1', 'session-id-1', changePwdDto);

      expect(result).toEqual({
        success: true,
        message: 'Password changed successfully',
      });
      expect(mockTx.user.update).toHaveBeenCalled();
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        PasswordChangedEvent.eventName,
        expect.any(PasswordChangedEvent),
      );
      expect(authRepository.createActivityLog).toHaveBeenCalled();
    });

    it('should throw InvalidCredentialsException when current password is wrong', async () => {
      authRepository.findUserWithProfile.mockResolvedValue(mockUserWithProfile as never);
      passwordService.verifyPassword.mockResolvedValue(false);

      await expect(
        service.changePassword('user-id-1', 'session-id-1', changePwdDto),
      ).rejects.toThrow(InvalidCredentialsException);
    });

    it('should throw PasswordMismatchException when passwords do not match', async () => {
      authRepository.findUserWithProfile.mockResolvedValue(mockUserWithProfile as never);
      passwordService.verifyPassword.mockResolvedValue(true);

      await expect(
        service.changePassword('user-id-1', 'session-id-1', {
          ...changePwdDto,
          confirmPassword: 'DifferentPass1!',
        }),
      ).rejects.toThrow(PasswordMismatchException);
    });

    it('should throw WeakPasswordException for weak password', async () => {
      authRepository.findUserWithProfile.mockResolvedValue(mockUserWithProfile as never);
      passwordService.verifyPassword.mockResolvedValue(true);
      passwordService.validatePasswordStrength.mockReturnValue({
        isValid: false,
        errors: ['Password must contain at least one uppercase letter'],
      });

      await expect(
        service.changePassword('user-id-1', 'session-id-1', changePwdDto),
      ).rejects.toThrow(WeakPasswordException);
    });

    it('should revoke other sessions when logoutOtherDevices is true', async () => {
      authRepository.findUserWithProfile.mockResolvedValue(mockUserWithProfile as never);
      passwordService.verifyPassword.mockResolvedValue(true);
      passwordService.validatePasswordStrength.mockReturnValue({
        isValid: true,
        errors: [],
      });
      passwordService.hashPassword.mockResolvedValue('new-hashed-password');
      authRepository.$transaction.mockImplementation((fn: (tx: never) => Promise<unknown>) =>
        fn(mockTx as never),
      );

      await service.changePassword('user-id-1', 'session-id-1', {
        ...changePwdDto,
        logoutOtherDevices: true,
      });

      expect(mockTx.session.updateMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-id-1',
          id: { not: 'session-id-1' },
          isRevoked: false,
          status: 'ACTIVE',
          isDeleted: false,
        },
        data: {
          isRevoked: true,
          revokedAt: expect.any(Date),
          revocationReason: 'PASSWORD_CHANGED_OTHER_DEVICES',
          status: 'REVOKED',
        },
      });
    });

    it('should not revoke current session when logoutOtherDevices is true', async () => {
      authRepository.findUserWithProfile.mockResolvedValue(mockUserWithProfile as never);
      passwordService.verifyPassword.mockResolvedValue(true);
      passwordService.validatePasswordStrength.mockReturnValue({
        isValid: true,
        errors: [],
      });
      passwordService.hashPassword.mockResolvedValue('new-hashed-password');
      authRepository.$transaction.mockImplementation((fn: (tx: never) => Promise<unknown>) =>
        fn(mockTx as never),
      );

      await service.changePassword('user-id-1', 'session-id-1', {
        ...changePwdDto,
        logoutOtherDevices: true,
      });

      const sessionFilter = (mockTx.session.updateMany as jest.Mock).mock.calls[0][0].where;
      expect(sessionFilter.id).toEqual({ not: 'session-id-1' });
    });

    it('should rollback transaction on failure', async () => {
      authRepository.findUserWithProfile.mockResolvedValue(mockUserWithProfile as never);
      passwordService.verifyPassword.mockResolvedValue(true);
      passwordService.validatePasswordStrength.mockReturnValue({
        isValid: true,
        errors: [],
      });
      passwordService.hashPassword.mockResolvedValue('new-hashed-password');
      authRepository.$transaction.mockRejectedValue(new Error('Database error'));

      await expect(
        service.changePassword('user-id-1', 'session-id-1', changePwdDto),
      ).rejects.toThrow('Database error');
    });
  });

  // ─── Upload Profile Photo ──────────────────────────

  describe('uploadProfilePhoto', () => {
    it('should upload photo and create file attachment', async () => {
      authRepository.createFileAttachment.mockResolvedValue({
        id: 'file-id-1',
        originalFileName: 'photo.jpg',
        fileSize: 1024 * 1024,
        mimeType: 'image/jpeg',
      } as never);
      authRepository.updateUser.mockResolvedValue({} as never);

      const result = await service.uploadProfilePhoto('user-id-1', 'company-id-1', mockFile);

      expect(result).toEqual({
        success: true,
        message: 'Profile photo uploaded successfully',
        data: {
          fileId: 'file-id-1',
          fileName: 'photo.jpg',
          fileUrl: expect.stringContaining('/uploads/profiles/'),
          fileSize: 1024 * 1024,
          mimeType: 'image/jpeg',
        },
      });
      expect(authRepository.createFileAttachment).toHaveBeenCalled();
      expect(authRepository.updateUser).toHaveBeenCalledWith('user-id-1', {
        profilePhotoUrl: expect.stringContaining('/uploads/profiles/'),
      });
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        ProfilePhotoUploadedEvent.eventName,
        expect.any(ProfilePhotoUploadedEvent),
      );
      expect(authRepository.createActivityLog).toHaveBeenCalled();
    });

    it('should throw InvalidFileException for unsupported file type', async () => {
      const invalidFile = { ...mockFile, mimetype: 'image/gif' };

      await expect(
        service.uploadProfilePhoto('user-id-1', 'company-id-1', invalidFile),
      ).rejects.toThrow(InvalidFileException);
      expect(authRepository.createFileAttachment).not.toHaveBeenCalled();
    });

    it('should throw FileTooLargeException for oversized file', async () => {
      const oversizedFile = { ...mockFile, size: 6 * 1024 * 1024 };

      await expect(
        service.uploadProfilePhoto('user-id-1', 'company-id-1', oversizedFile),
      ).rejects.toThrow(FileTooLargeException);
      expect(authRepository.createFileAttachment).not.toHaveBeenCalled();
    });
  });

  // ─── Update Preferences ────────────────────────────

  describe('updatePreferences', () => {
    it('should update language and timezone', async () => {
      authRepository.findUserWithProfile.mockResolvedValue(mockUserWithProfile as never);
      authRepository.updateUser.mockResolvedValue({} as never);

      const result = await service.updatePreferences('user-id-1', {
        preferredLanguage: 'HI',
        timezone: 'ASIA_DUBAI',
      });

      expect(result).toEqual({
        success: true,
        message: 'Preferences updated successfully',
      });
      expect(authRepository.updateUser).toHaveBeenCalledWith('user-id-1', {
        preferredLanguage: 'HI',
        timezone: 'ASIA_DUBAI',
      });
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        PreferencesUpdatedEvent.eventName,
        expect.any(PreferencesUpdatedEvent),
      );
      expect(authRepository.createActivityLog).toHaveBeenCalled();
    });

    it('should store dateFormat, timeFormat, and theme in metadata', async () => {
      const userWithMetadata = {
        ...mockUserWithProfile,
        metadata: null,
      };
      authRepository.findUserWithProfile.mockResolvedValue(userWithMetadata as never);
      authRepository.updateUser.mockResolvedValue({} as never);

      await service.updatePreferences('user-id-1', {
        dateFormat: 'DD/MM/YYYY',
        timeFormat: '24h',
        theme: 'dark',
      });

      expect(authRepository.updateUser).toHaveBeenCalledWith('user-id-1', {
        metadata: {
          dateFormat: 'DD/MM/YYYY',
          timeFormat: '24h',
          theme: 'dark',
        },
      });
    });

    it('should merge with existing metadata', async () => {
      const userWithExistingMetadata = {
        ...mockUserWithProfile,
        metadata: { theme: 'light' },
      };
      authRepository.findUserWithProfile.mockResolvedValue(userWithExistingMetadata as never);
      authRepository.updateUser.mockResolvedValue({} as never);

      await service.updatePreferences('user-id-1', {
        dateFormat: 'DD/MM/YYYY',
      });

      expect(authRepository.updateUser).toHaveBeenCalledWith('user-id-1', {
        metadata: { theme: 'light', dateFormat: 'DD/MM/YYYY' },
      });
    });

    it('should send event and create activity log', async () => {
      authRepository.findUserWithProfile.mockResolvedValue(mockUserWithProfile as never);
      authRepository.updateUser.mockResolvedValue({} as never);

      await service.updatePreferences('user-id-1', {
        preferredLanguage: 'EN',
      });

      expect(eventEmitter.emit).toHaveBeenCalledWith(
        PreferencesUpdatedEvent.eventName,
        expect.any(PreferencesUpdatedEvent),
      );
      expect(authRepository.createActivityLog).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Preferences Updated',
          activityType: 'SETTINGS_CHANGE',
        }),
      );
    });
  });
});
