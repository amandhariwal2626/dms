import { Test, type TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import type { User, EmailVerificationToken } from '@prisma/client';
import { PasswordResetService } from './password-reset.service';
import { PasswordService } from './password.service';
import { HashService } from './hash.service';
import { AuthRepository } from '../repositories/auth.repository';
import {
  PasswordResetRequestedEvent,
  PasswordResetVerifiedEvent,
  PasswordChangedEvent,
} from '../events/auth.events';
import {
  InvalidOtpException,
  OtpExpiredException,
  TooManyAttemptsException,
  TooManyResendsException,
  TokenUsedException,
  WeakPasswordException,
  PasswordMismatchException,
} from '../exceptions/auth.exceptions';

describe('PasswordResetService', () => {
  let service: PasswordResetService;
  let passwordService: jest.Mocked<PasswordService>;
  let hashService: jest.Mocked<HashService>;
  let authRepository: jest.Mocked<AuthRepository>;
  let eventEmitter: jest.Mocked<EventEmitter2>;

  const mockUser: User = {
    id: 'user-id-1',
    email: 'john@example.com',
    normalizedEmail: 'john@example.com',
    username: 'john',
    normalizedUsername: 'john',
    mobileNumber: null,
    alternateMobileNumber: null,
    firstName: 'John',
    middleName: null,
    lastName: null,
    displayName: null,
    profilePhotoUrl: null,
    gender: null,
    dateOfBirth: null,
    bloodGroup: null,
    maritalStatus: null,
    nationality: null,
    preferredLanguage: 'EN',
    timezone: 'ASIA_KOLKATA',
    preferredCommunicationChannel: 'EMAIL',
    passwordHash: 'old-hash',
    passwordChangedAt: null,
    emailVerified: true,
    emailVerifiedAt: null,
    mobileVerified: false,
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
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: null,
    updatedBy: null,
    deletedAt: null,
    deletedBy: null,
    isDeleted: false,
    version: 1,
  };

  const mockToken: EmailVerificationToken = {
    id: 'token-id-1',
    email: 'john@example.com',
    token: null,
    otp: 'hashed-otp-value',
    purpose: 'RESET_PASSWORD',
    tokenType: 'OTP',
    expiresAt: new Date(Date.now() + 600_000),
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
    metadata: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: null,
    updatedBy: null,
    deletedAt: null,
    deletedBy: null,
    isDeleted: false,
    version: 1,
  };

  const mockVerifiedToken: EmailVerificationToken = {
    ...mockToken,
    status: 'VERIFIED',
    verifiedAt: new Date(),
  };

  const mockExpiredToken: EmailVerificationToken = {
    ...mockToken,
    expiresAt: new Date(Date.now() - 60_000),
  };

  const mockUsedToken: EmailVerificationToken = {
    ...mockToken,
    status: 'VERIFIED',
    verifiedAt: new Date(),
    isUsed: true,
    usedAt: new Date(),
  };

  const mockBlockedToken: EmailVerificationToken = {
    ...mockToken,
    attemptCount: 5,
    maxAttempts: 5,
  };

  const mockForgotPasswordDto = { email: 'john@example.com' };
  const mockResendDto = { email: 'john@example.com' };
  const mockVerifyDto = { email: 'john@example.com', otp: '123456' };
  const mockResetDto = {
    email: 'john@example.com',
    otp: '123456',
    newPassword: 'NewStrongPass1!',
    confirmPassword: 'NewStrongPass1!',
    logoutFromAllDevices: false,
  };

  const mockTx = {
    user: { update: jest.fn().mockResolvedValue({}) },
    emailVerificationToken: { update: jest.fn().mockResolvedValue({}) },
    session: { updateMany: jest.fn().mockResolvedValue({ count: 3 }) },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PasswordResetService,
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
          provide: HashService,
          useValue: {
            hash: jest.fn().mockReturnValue('hashed-otp-value'),
            compare: jest.fn(),
            generateRandomString: jest.fn(),
            generateRandomToken: jest.fn(),
            generateChecksum: jest.fn(),
          },
        },
        {
          provide: AuthRepository,
          useValue: {
            findUserByEmail: jest.fn(),
            invalidatePendingTokens: jest.fn(),
            createVerificationToken: jest.fn(),
            createActivityLog: jest.fn(),
            findPasswordResetToken: jest.fn(),
            findVerifiedPasswordResetToken: jest.fn(),
            updateVerificationToken: jest.fn(),
            updateUserPassword: jest.fn(),
            revokeAllUserSessions: jest.fn(),
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

    service = module.get<PasswordResetService>(PasswordResetService);
    passwordService = module.get(PasswordService);
    hashService = module.get(HashService);
    authRepository = module.get(AuthRepository);
    eventEmitter = module.get(EventEmitter2);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ─── Forgot Password ───────────────────────────────

  describe('forgotPassword', () => {
    it('should generate OTP and invalidate old tokens for eligible user', async () => {
      authRepository.findUserByEmail.mockResolvedValue(mockUser);
      hashService.hash.mockReturnValue('hashed-otp');
      authRepository.createVerificationToken.mockResolvedValue({ id: 'new-token-id' } as never);

      const result = await service.forgotPassword(mockForgotPasswordDto);

      expect(result).toEqual({
        success: true,
        message: 'If an account with this email exists, a reset code has been sent',
      });
      expect(authRepository.invalidatePendingTokens).toHaveBeenCalledWith(
        'john@example.com',
        'RESET_PASSWORD',
      );
      expect(authRepository.createVerificationToken).toHaveBeenCalled();
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        PasswordResetRequestedEvent.eventName,
        expect.any(PasswordResetRequestedEvent),
      );
      expect(authRepository.createActivityLog).toHaveBeenCalled();
    });

    it('should return generic success for non-existent email', async () => {
      authRepository.findUserByEmail.mockResolvedValue(null);

      const result = await service.forgotPassword(mockForgotPasswordDto);

      expect(result).toEqual({
        success: true,
        message: 'If an account with this email exists, a reset code has been sent',
      });
      expect(authRepository.invalidatePendingTokens).not.toHaveBeenCalled();
      expect(authRepository.createVerificationToken).not.toHaveBeenCalled();
      expect(eventEmitter.emit).not.toHaveBeenCalled();
      expect(authRepository.createActivityLog).not.toHaveBeenCalled();
    });

    it('should return generic success for soft-deleted user', async () => {
      authRepository.findUserByEmail.mockResolvedValue({
        ...mockUser,
        isDeleted: true,
      } as User);

      const result = await service.forgotPassword(mockForgotPasswordDto);

      expect(result).toEqual({
        success: true,
        message: 'If an account with this email exists, a reset code has been sent',
      });
      expect(authRepository.invalidatePendingTokens).not.toHaveBeenCalled();
    });

    it('should return generic success for inactive user', async () => {
      authRepository.findUserByEmail.mockResolvedValue({
        ...mockUser,
        status: 'INACTIVE',
      } as User);

      const result = await service.forgotPassword(mockForgotPasswordDto);

      expect(result.success).toBe(true);
      expect(authRepository.invalidatePendingTokens).not.toHaveBeenCalled();
    });

    it('should return generic success for unverified email', async () => {
      authRepository.findUserByEmail.mockResolvedValue({
        ...mockUser,
        emailVerified: false,
      } as User);

      const result = await service.forgotPassword(mockForgotPasswordDto);

      expect(result.success).toBe(true);
      expect(authRepository.invalidatePendingTokens).not.toHaveBeenCalled();
    });
  });

  // ─── Resend Password Reset ─────────────────────────

  describe('resendPasswordReset', () => {
    it('should resend OTP within resend limit', async () => {
      authRepository.findPasswordResetToken.mockResolvedValue({
        ...mockToken,
        resendCount: 2,
      } as EmailVerificationToken);
      hashService.hash.mockReturnValue('new-hashed-otp');

      const result = await service.resendPasswordReset(mockResendDto);

      expect(result).toEqual({
        success: true,
        message: 'A new reset code has been sent to your email',
      });
      expect(authRepository.invalidatePendingTokens).toHaveBeenCalledWith(
        'john@example.com',
        'RESET_PASSWORD',
      );
      expect(authRepository.createVerificationToken).toHaveBeenCalled();
    });

    it('should throw TooManyResendsException when resend limit exceeded', async () => {
      authRepository.findPasswordResetToken.mockResolvedValue({
        ...mockToken,
        resendCount: 5,
      } as EmailVerificationToken);

      await expect(service.resendPasswordReset(mockResendDto)).rejects.toThrow(
        TooManyResendsException,
      );
      expect(authRepository.invalidatePendingTokens).not.toHaveBeenCalled();
    });

    it('should handle resend when no previous token exists', async () => {
      authRepository.findPasswordResetToken.mockResolvedValue(null);
      hashService.hash.mockReturnValue('new-hashed-otp');

      const result = await service.resendPasswordReset(mockResendDto);

      expect(result.success).toBe(true);
      expect(authRepository.createVerificationToken).toHaveBeenCalled();
    });

    it('should create activity log when user exists', async () => {
      authRepository.findPasswordResetToken.mockResolvedValue(mockToken);
      authRepository.findUserByEmail.mockResolvedValue(mockUser);
      hashService.hash.mockReturnValue('new-hashed-otp');

      await service.resendPasswordReset(mockResendDto);

      expect(authRepository.createActivityLog).toHaveBeenCalled();
    });
  });

  // ─── Verify Password Reset ─────────────────────────

  describe('verifyPasswordReset', () => {
    it('should verify OTP successfully', async () => {
      authRepository.findPasswordResetToken.mockResolvedValue(mockToken);
      hashService.compare.mockReturnValue(true);
      authRepository.findUserByEmail.mockResolvedValue(mockUser);

      const result = await service.verifyPasswordReset(mockVerifyDto);

      expect(result).toEqual({
        success: true,
        message: 'OTP verified successfully',
      });
      expect(authRepository.updateVerificationToken).toHaveBeenCalledWith('token-id-1', {
        status: 'VERIFIED',
        verifiedAt: expect.any(Date),
      });
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        PasswordResetVerifiedEvent.eventName,
        expect.any(PasswordResetVerifiedEvent),
      );
      expect(authRepository.createActivityLog).toHaveBeenCalled();
    });

    it('should throw InvalidOtpException for invalid OTP format', async () => {
      await expect(
        service.verifyPasswordReset({ email: 'john@example.com', otp: 'abc' }),
      ).rejects.toThrow(InvalidOtpException);
    });

    it('should throw InvalidOtpException when no token found', async () => {
      authRepository.findPasswordResetToken.mockResolvedValue(null);

      await expect(service.verifyPasswordReset(mockVerifyDto)).rejects.toThrow(InvalidOtpException);
    });

    it('should throw OtpExpiredException for expired token', async () => {
      authRepository.findPasswordResetToken.mockResolvedValue(mockExpiredToken);

      await expect(service.verifyPasswordReset(mockVerifyDto)).rejects.toThrow(OtpExpiredException);
      expect(authRepository.updateVerificationToken).toHaveBeenCalledWith('token-id-1', {
        status: 'EXPIRED',
      });
    });

    it('should throw TooManyAttemptsException when max attempts reached', async () => {
      authRepository.findPasswordResetToken.mockResolvedValue(mockBlockedToken);

      await expect(service.verifyPasswordReset(mockVerifyDto)).rejects.toThrow(
        TooManyAttemptsException,
      );
    });

    it('should increment attempt count on wrong OTP and block after max', async () => {
      const nearLimitToken = { ...mockToken, attemptCount: 4, maxAttempts: 5 };
      authRepository.findPasswordResetToken.mockResolvedValue(nearLimitToken);
      hashService.compare.mockReturnValue(false);

      await expect(service.verifyPasswordReset(mockVerifyDto)).rejects.toThrow(InvalidOtpException);

      expect(authRepository.updateVerificationToken).toHaveBeenCalledWith('token-id-1', {
        attemptCount: 5,
        failureReason: 'Invalid OTP',
        status: 'BLOCKED',
      });
    });

    it('should not publish event when user not found after verification', async () => {
      authRepository.findPasswordResetToken.mockResolvedValue(mockToken);
      hashService.compare.mockReturnValue(true);
      authRepository.findUserByEmail.mockResolvedValue(null);

      await service.verifyPasswordReset(mockVerifyDto);

      expect(eventEmitter.emit).not.toHaveBeenCalled();
      expect(authRepository.createActivityLog).not.toHaveBeenCalled();
    });
  });

  // ─── Reset Password ────────────────────────────────

  describe('resetPassword', () => {
    it('should reset password successfully without logging out all devices', async () => {
      authRepository.findVerifiedPasswordResetToken.mockResolvedValue(mockVerifiedToken);
      authRepository.findUserByEmail.mockResolvedValue(mockUser);
      passwordService.validatePasswordStrength.mockReturnValue({
        isValid: true,
        errors: [],
      });
      passwordService.hashPassword.mockResolvedValue('new-hashed-password');
      authRepository.$transaction.mockImplementation((fn: (tx: never) => Promise<unknown>) =>
        fn(mockTx as never),
      );

      const result = await service.resetPassword(mockResetDto);

      expect(result).toEqual({
        success: true,
        message: 'Password has been reset successfully',
      });
      expect(passwordService.hashPassword).toHaveBeenCalledWith('NewStrongPass1!');
      expect(mockTx.user.update).toHaveBeenCalled();
      expect(mockTx.emailVerificationToken.update).toHaveBeenCalledWith({
        where: { id: 'token-id-1' },
        data: { isUsed: true, usedAt: expect.any(Date) },
      });
      expect(mockTx.session.updateMany).not.toHaveBeenCalled();
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        PasswordChangedEvent.eventName,
        expect.any(PasswordChangedEvent),
      );
      expect(authRepository.createActivityLog).toHaveBeenCalled();
    });

    it('should reset password and revoke all sessions when logoutFromAllDevices is true', async () => {
      authRepository.findVerifiedPasswordResetToken.mockResolvedValue(mockVerifiedToken);
      authRepository.findUserByEmail.mockResolvedValue(mockUser);
      passwordService.validatePasswordStrength.mockReturnValue({
        isValid: true,
        errors: [],
      });
      passwordService.hashPassword.mockResolvedValue('new-hashed-password');
      authRepository.$transaction.mockImplementation((fn: (tx: never) => Promise<unknown>) =>
        fn(mockTx as never),
      );

      const dto = { ...mockResetDto, logoutFromAllDevices: true };
      await service.resetPassword(dto);

      expect(mockTx.session.updateMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-id-1',
          isRevoked: false,
          status: 'ACTIVE',
          isDeleted: false,
        },
        data: {
          isRevoked: true,
          revokedAt: expect.any(Date),
          revocationReason: 'PASSWORD_CHANGED',
          status: 'REVOKED',
        },
      });
    });

    it('should throw PasswordMismatchException when passwords do not match', async () => {
      const dto = {
        ...mockResetDto,
        confirmPassword: 'DifferentPass1!',
      };

      await expect(service.resetPassword(dto)).rejects.toThrow(PasswordMismatchException);
      expect(passwordService.hashPassword).not.toHaveBeenCalled();
    });

    it('should throw WeakPasswordException for weak password', async () => {
      passwordService.validatePasswordStrength.mockReturnValue({
        isValid: false,
        errors: ['Password must contain at least one uppercase letter'],
      });

      await expect(service.resetPassword(mockResetDto)).rejects.toThrow(WeakPasswordException);
      expect(passwordService.hashPassword).not.toHaveBeenCalled();
    });

    it('should throw InvalidOtpException when no verified token found', async () => {
      passwordService.validatePasswordStrength.mockReturnValue({
        isValid: true,
        errors: [],
      });
      authRepository.findVerifiedPasswordResetToken.mockResolvedValue(null);

      await expect(service.resetPassword(mockResetDto)).rejects.toThrow(InvalidOtpException);
    });

    it('should throw OtpExpiredException when token is expired', async () => {
      passwordService.validatePasswordStrength.mockReturnValue({
        isValid: true,
        errors: [],
      });
      authRepository.findVerifiedPasswordResetToken.mockResolvedValue({
        ...mockVerifiedToken,
        expiresAt: new Date(Date.now() - 60_000),
      } as EmailVerificationToken);

      await expect(service.resetPassword(mockResetDto)).rejects.toThrow(OtpExpiredException);
    });

    it('should throw TokenUsedException when token is already used', async () => {
      passwordService.validatePasswordStrength.mockReturnValue({
        isValid: true,
        errors: [],
      });
      authRepository.findVerifiedPasswordResetToken.mockResolvedValue(mockUsedToken);

      await expect(service.resetPassword(mockResetDto)).rejects.toThrow(TokenUsedException);
    });

    it('should rollback transaction on failure', async () => {
      authRepository.findVerifiedPasswordResetToken.mockResolvedValue(mockVerifiedToken);
      authRepository.findUserByEmail.mockResolvedValue(mockUser);
      passwordService.validatePasswordStrength.mockReturnValue({
        isValid: true,
        errors: [],
      });
      passwordService.hashPassword.mockResolvedValue('new-hashed-password');
      authRepository.$transaction.mockRejectedValue(new Error('Database error'));

      await expect(service.resetPassword(mockResetDto)).rejects.toThrow('Database error');
    });

    it('should increment refreshTokenVersion on password change', async () => {
      authRepository.findVerifiedPasswordResetToken.mockResolvedValue(mockVerifiedToken);
      authRepository.findUserByEmail.mockResolvedValue(mockUser);
      passwordService.validatePasswordStrength.mockReturnValue({
        isValid: true,
        errors: [],
      });
      passwordService.hashPassword.mockResolvedValue('new-hashed-password');
      authRepository.$transaction.mockImplementation((fn: (tx: never) => Promise<unknown>) =>
        fn(mockTx as never),
      );

      await service.resetPassword(mockResetDto);

      expect(mockTx.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-id-1' },
          data: expect.objectContaining({
            refreshTokenVersion: 1,
            passwordResetRequired: false,
            forcePasswordChange: false,
          }),
        }),
      );
    });
  });
});
