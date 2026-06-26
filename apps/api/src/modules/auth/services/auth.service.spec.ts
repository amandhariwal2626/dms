import { Test, type TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import type { Prisma, User } from '@prisma/client';
import { AuthService } from './auth.service';
import { PasswordService } from './password.service';
import { TokenService } from './token.service';
import { JwtConfigService } from './jwt-config.service';
import { HashService } from './hash.service';
import { SessionTokenService } from './session-token.service';
import { AuthRepository } from '../repositories/auth.repository';
import {
  DuplicateEmailException,
  PasswordMismatchException,
  TermsNotAcceptedException,
  WeakPasswordException,
  InvalidCredentialsException,
  EmailNotVerifiedException,
  AccountLockedException,
  InactiveUserException,
  CompanyAccessDeniedException,
  InactiveCompanyException,
  InactiveCompanyUserException,
} from '../exceptions/auth.exceptions';

describe('AuthService', () => {
  let authService: AuthService;
  let passwordService: jest.Mocked<PasswordService>;
  let authRepository: jest.Mocked<AuthRepository>;
  let eventEmitter: jest.Mocked<EventEmitter2>;

  const mockRegisterDto = {
    companyName: 'Test Company',
    displayName: 'Test Company Display',
    businessType: 'PRIVATE_LIMITED',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    mobileNumber: '+919876543210',
    password: 'StrongPass1!',
    confirmPassword: 'StrongPass1!',
    acceptTerms: true,
  };

  let tokenService: jest.Mocked<TokenService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
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
          provide: TokenService,
          useValue: {
            generateAccessToken: jest.fn(),
            generateRefreshToken: jest.fn(),
            generateTokenPair: jest.fn(),
            verifyAccessToken: jest.fn(),
            verifyRefreshToken: jest.fn(),
            decodeToken: jest.fn(),
          },
        },
        {
          provide: JwtConfigService,
          useValue: {
            accessToken: {
              secret: 'test-secret',
              expiresIn: '15m',
              algorithm: 'HS256',
            },
            refreshToken: {
              secret: 'test-refresh-secret',
              expiresIn: '7d',
              algorithm: 'HS256',
            },
            issuer: 'test-issuer',
            audience: 'test-audience',
          },
        },
        {
          provide: HashService,
          useValue: {
            hash: jest.fn().mockReturnValue('hashed-value'),
            compare: jest.fn(),
            generateRandomString: jest.fn(),
            generateRandomToken: jest.fn(),
            generateChecksum: jest.fn(),
          },
        },
        {
          provide: SessionTokenService,
          useValue: {
            generateSessionIdentifier: jest.fn().mockReturnValue('sess_test123'),
            generateDeviceFingerprint: jest.fn(),
            generateRefreshTokenIdentifier: jest.fn().mockReturnValue('ref_test123'),
            generateAccessTokenIdentifier: jest.fn().mockReturnValue('at_test123'),
          },
        },
        {
          provide: AuthRepository,
          useValue: {
            findUserByNormalizedEmail: jest.fn(),
            findUserByEmailOrUsername: jest.fn(),
            findActiveCompanyMemberships: jest.fn(),
            createSession: jest.fn(),
            updateLastLogin: jest.fn(),
            resetFailedAttempts: jest.fn(),
            incrementFailedAttempts: jest.fn(),
            lockAccount: jest.fn(),
            findUserCompanies: jest.fn(),
            findCompanyUser: jest.fn(),
            updateCompanyUserLastAccessed: jest.fn(),
            updateSessionCompanyContext: jest.fn(),
            createActivityLog: jest.fn(),
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

    authService = module.get<AuthService>(AuthService);
    passwordService = module.get(PasswordService);
    tokenService = module.get(TokenService);
    authRepository = module.get(AuthRepository);
    eventEmitter = module.get(EventEmitter2);
  });

  describe('register', () => {
    it('should throw TermsNotAcceptedException when terms are not accepted', async () => {
      const dto = { ...mockRegisterDto, acceptTerms: false };

      await expect(authService.register(dto)).rejects.toThrow(TermsNotAcceptedException);
    });

    it('should throw PasswordMismatchException when passwords do not match', async () => {
      const dto = { ...mockRegisterDto, confirmPassword: 'DifferentPass1!' };

      await expect(authService.register(dto)).rejects.toThrow(PasswordMismatchException);
    });

    it('should throw WeakPasswordException when password validation fails', async () => {
      passwordService.validatePasswordStrength.mockReturnValue({
        isValid: false,
        errors: ['Password must contain at least one uppercase letter'],
      });

      await expect(authService.register(mockRegisterDto)).rejects.toThrow(WeakPasswordException);
    });

    it('should throw DuplicateEmailException when email already exists', async () => {
      passwordService.validatePasswordStrength.mockReturnValue({ isValid: true, errors: [] });
      authRepository.findUserByNormalizedEmail.mockResolvedValue({
        id: 'existing-user-id',
      } as never);

      await expect(authService.register(mockRegisterDto)).rejects.toThrow(DuplicateEmailException);
    });

    it('should successfully register a user and return expected response', async () => {
      passwordService.validatePasswordStrength.mockReturnValue({ isValid: true, errors: [] });
      authRepository.findUserByNormalizedEmail.mockResolvedValue(null);
      passwordService.hashPassword.mockResolvedValue('hashed-password');

      const mockTx = {
        company: {
          create: jest.fn().mockResolvedValue({ id: 'company-id', companyCode: 'CMP000001' }),
          findFirst: jest.fn().mockResolvedValue({ companyCode: 'CMP000005' }),
        },
        companySettings: {
          create: jest.fn().mockResolvedValue({ id: 'settings-id' }),
        },
        user: {
          create: jest.fn().mockResolvedValue({ id: 'user-id' }),
        },
        companyUser: {
          create: jest.fn().mockResolvedValue({ id: 'company-user-id' }),
        },
        role: {
          findUnique: jest.fn().mockResolvedValue(null),
          create: jest.fn().mockResolvedValue({ id: 'role-id' }),
        },
        userRole: {
          create: jest.fn().mockResolvedValue({ id: 'user-role-id' }),
        },
        activityLog: {
          create: jest.fn().mockResolvedValue({ id: 'log-id' }),
        },
      };

      authRepository.$transaction.mockImplementation(
        (fn: (tx: Prisma.TransactionClient) => Promise<unknown>) =>
          fn(mockTx as unknown as Prisma.TransactionClient),
      );

      const result = await authService.register(mockRegisterDto);

      expect(result).toEqual({
        success: true,
        message: 'Registration successful. Please verify your email.',
        companyId: 'company-id',
        userId: 'user-id',
        companyUserId: 'company-user-id',
        nextStep: 'VERIFY_EMAIL',
      });

      expect(eventEmitter.emit).toHaveBeenCalled();
    });

    it('should rollback transaction on failure', async () => {
      passwordService.validatePasswordStrength.mockReturnValue({ isValid: true, errors: [] });
      authRepository.findUserByNormalizedEmail.mockResolvedValue(null);
      passwordService.hashPassword.mockResolvedValue('hashed-password');

      authRepository.$transaction.mockRejectedValue(new Error('Database error'));

      await expect(authService.register(mockRegisterDto)).rejects.toThrow('Database error');
    });
  });

  describe('login', () => {
    const mockLoginDto = {
      emailOrUsername: 'john@example.com',
      password: 'StrongPass1!',
      rememberMe: false,
    };

    const mockUser = {
      id: 'user-id',
      email: 'john@example.com',
      normalizedEmail: 'john@example.com',
      firstName: 'John',
      lastName: 'Doe',
      displayName: null,
      passwordHash: 'hashed-password',
      emailVerified: true,
      isActive: true,
      isDeleted: false,
      status: 'ACTIVE',
      refreshTokenVersion: 0,
      failedLoginAttempts: 0,
      lockUntil: null,
      lastLoginAt: null,
    } as User;

    const mockCompanyMembership = {
      id: 'cm-id',
      companyId: 'company-id',
      userId: 'user-id',
      isDefaultCompany: true,
      isPrimaryCompany: true,
      status: 'ACTIVE',
      isActive: true,
      company: {
        id: 'company-id',
        companyCode: 'CMP000001',
        legalName: 'Test Company',
        displayName: 'Test Company Display',
      },
    } as const;

    const mockSecondMembership = {
      id: 'cm-id-2',
      companyId: 'company-id-2',
      userId: 'user-id',
      isDefaultCompany: false,
      isPrimaryCompany: false,
      status: 'ACTIVE',
      isActive: true,
      company: {
        id: 'company-id-2',
        companyCode: 'CMP000002',
        legalName: 'Second Company',
        displayName: null,
      },
    } as const;

    const mockTokenPair = {
      accessToken: 'access-token-value',
      refreshToken: 'refresh-token-value',
      accessTokenExpiresAt: new Date(Date.now() + 15 * 60 * 1000),
      refreshTokenExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    };

    const mockTx = {
      session: {
        create: jest.fn().mockResolvedValue({ id: 'session-id' }),
      },
      user: {
        update: jest.fn().mockResolvedValue(mockUser),
      },
    };

    function setupSuccessfulLoginMocks() {
      authRepository.findUserByEmailOrUsername.mockResolvedValue(mockUser);
      passwordService.verifyPassword.mockResolvedValue(true);
      authRepository.findActiveCompanyMemberships.mockResolvedValue([
        mockCompanyMembership,
      ] as never);
      tokenService.generateTokenPair.mockResolvedValue(mockTokenPair);
      authRepository.$transaction.mockImplementation(
        (fn: (tx: Prisma.TransactionClient) => Promise<unknown>) =>
          fn(mockTx as unknown as Prisma.TransactionClient),
      );
      authRepository.createActivityLog.mockResolvedValue({ id: 'log-id' } as never);
    }

    it('should login successfully with single company', async () => {
      setupSuccessfulLoginMocks();

      const result = await authService.login(mockLoginDto);

      expect(result.success).toBe(true);
      expect(result.accessToken).toBe('access-token-value');
      expect(result.refreshToken).toBe('refresh-token-value');
      expect(result.user.id).toBe('user-id');
      expect(result.user.email).toBe('john@example.com');
      expect(result.companies).toHaveLength(1);
      expect(result.requiresCompanySelection).toBe(false);
      expect(result.defaultCompany.companyId).toBe('company-id');
      expect(eventEmitter.emit).toHaveBeenCalled();
    });

    it('should login successfully with multiple companies', async () => {
      setupSuccessfulLoginMocks();
      authRepository.findActiveCompanyMemberships.mockResolvedValue([
        mockCompanyMembership,
        mockSecondMembership,
      ] as never);

      const result = await authService.login(mockLoginDto);

      expect(result.success).toBe(true);
      expect(result.companies).toHaveLength(2);
      expect(result.requiresCompanySelection).toBe(true);
      expect(result.defaultCompany.companyId).toBe('company-id');
    });

    it('should throw InvalidCredentialsException when user not found', async () => {
      authRepository.findUserByEmailOrUsername.mockResolvedValue(null);

      await expect(authService.login(mockLoginDto)).rejects.toThrow(InvalidCredentialsException);
    });

    it('should throw InvalidCredentialsException when password is invalid', async () => {
      authRepository.findUserByEmailOrUsername.mockResolvedValue(mockUser);
      passwordService.verifyPassword.mockResolvedValue(false);
      authRepository.incrementFailedAttempts.mockResolvedValue({} as never);

      await expect(authService.login(mockLoginDto)).rejects.toThrow(InvalidCredentialsException);
    });

    it('should lock account after max failed attempts', async () => {
      const userWithAttempts = {
        ...mockUser,
        failedLoginAttempts: 4,
      };

      authRepository.findUserByEmailOrUsername.mockResolvedValue(userWithAttempts);
      passwordService.verifyPassword.mockResolvedValue(false);
      authRepository.incrementFailedAttempts.mockResolvedValue({} as never);
      authRepository.lockAccount.mockResolvedValue({} as never);

      await expect(authService.login(mockLoginDto)).rejects.toThrow(InvalidCredentialsException);
      expect(authRepository.lockAccount).toHaveBeenCalled();
    });

    it('should throw InactiveUserException when user status is not ACTIVE', async () => {
      const inactiveUser = { ...mockUser, status: 'SUSPENDED' } as User;
      authRepository.findUserByEmailOrUsername.mockResolvedValue(inactiveUser);
      passwordService.verifyPassword.mockResolvedValue(true);

      await expect(authService.login(mockLoginDto)).rejects.toThrow(InactiveUserException);
    });

    it('should throw InactiveUserException when user is deleted', async () => {
      const deletedUser = { ...mockUser, isDeleted: true } as User;
      authRepository.findUserByEmailOrUsername.mockResolvedValue(deletedUser);
      passwordService.verifyPassword.mockResolvedValue(true);

      await expect(authService.login(mockLoginDto)).rejects.toThrow(InactiveUserException);
    });

    it('should throw EmailNotVerifiedException when email is not verified', async () => {
      const unverifiedUser = { ...mockUser, emailVerified: false } as User;
      authRepository.findUserByEmailOrUsername.mockResolvedValue(unverifiedUser);
      passwordService.verifyPassword.mockResolvedValue(true);

      await expect(authService.login(mockLoginDto)).rejects.toThrow(EmailNotVerifiedException);
    });

    it('should throw AccountLockedException when account is locked', async () => {
      const lockedUser = {
        ...mockUser,
        lockUntil: new Date(Date.now() + 60 * 60 * 1000),
      } as User;
      authRepository.findUserByEmailOrUsername.mockResolvedValue(lockedUser);
      passwordService.verifyPassword.mockResolvedValue(true);

      await expect(authService.login(mockLoginDto)).rejects.toThrow(AccountLockedException);
    });

    it('should create session and generate JWT tokens', async () => {
      setupSuccessfulLoginMocks();

      await authService.login(mockLoginDto);

      expect(authRepository.$transaction).toHaveBeenCalled();
      expect(tokenService.generateTokenPair).toHaveBeenCalled();
      expect(authRepository.createActivityLog).toHaveBeenCalled();
      expect(eventEmitter.emit).toHaveBeenCalled();
    });
  });

  describe('getUserCompanies', () => {
    const mockMembership = {
      id: 'cm-id',
      companyId: 'company-id',
      userId: 'user-id',
      isDefaultCompany: true,
      lastCompanyLoginAt: new Date(),
      company: {
        id: 'company-id',
        companyCode: 'CMP000001',
        legalName: 'Test Company',
        displayName: 'Test Company Display',
        logoUrl: null,
      },
      userRoles: [
        {
          role: { id: 'role-id', name: 'Admin', code: 'ADMIN' },
        },
      ],
    };

    it('should return formatted company list', async () => {
      authRepository.findUserCompanies.mockResolvedValue([mockMembership] as never);

      const result = await authService.getUserCompanies('user-id');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        companyId: 'company-id',
        companyCode: 'CMP000001',
        companyName: 'Test Company',
        displayName: 'Test Company Display',
        logo: null,
        companyUserId: 'cm-id',
        roles: [{ roleId: 'role-id', name: 'Admin', code: 'ADMIN' }],
        isDefaultCompany: true,
        lastAccessedAt: expect.any(Date),
      });
    });

    it('should use legalName when displayName is null', async () => {
      const membershipNoDisplay = {
        ...mockMembership,
        company: { ...mockMembership.company, displayName: null },
      };
      authRepository.findUserCompanies.mockResolvedValue([membershipNoDisplay] as never);

      const result = await authService.getUserCompanies('user-id');

      expect(result[0]?.displayName).toBe('Test Company');
    });
  });

  describe('selectCompany', () => {
    const mockCompanyUser = {
      id: 'cm-id',
      companyId: 'company-id',
      userId: 'user-id',
      status: 'ACTIVE',
      isActive: true,
      isDeleted: false,
      company: {
        id: 'company-id',
        companyCode: 'CMP000001',
        legalName: 'Test Company',
        displayName: 'Test Company Display',
        logoUrl: null,
        status: 'ACTIVE',
        isDeleted: false,
      },
      userRoles: [
        {
          role: { id: 'role-id', name: 'Admin', code: 'ADMIN' },
        },
      ],
    };

    beforeEach(() => {
      tokenService.generateAccessToken.mockResolvedValue('new-access-token');
      authRepository.updateCompanyUserLastAccessed.mockResolvedValue({} as never);
      authRepository.updateSessionCompanyContext.mockResolvedValue({} as never);
      authRepository.createActivityLog.mockResolvedValue({ id: 'log-id' } as never);
    });

    it('should select company and return new access token', async () => {
      authRepository.findCompanyUser.mockResolvedValue(mockCompanyUser as never);

      const result = await authService.selectCompany('user-id', 'company-id', 'session-id');

      expect(result.success).toBe(true);
      expect(result.accessToken).toBe('new-access-token');
      expect(result.companyId).toBe('company-id');
      expect(result.companyUserId).toBe('cm-id');
      expect(result.activeRoleIds).toEqual(['role-id']);
      expect(authRepository.updateCompanyUserLastAccessed).toHaveBeenCalledWith('cm-id');
      expect(authRepository.updateSessionCompanyContext).toHaveBeenCalledWith('session-id', {
        activeCompanyId: 'company-id',
        activeCompanyUserId: 'cm-id',
        lastActivityAt: expect.any(Date),
      });
      expect(eventEmitter.emit).toHaveBeenCalled();
      expect(authRepository.createActivityLog).toHaveBeenCalled();
    });

    it('should throw CompanyAccessDeniedException when user is not in company', async () => {
      authRepository.findCompanyUser.mockResolvedValue(null);

      await expect(
        authService.selectCompany('user-id', 'other-company', 'session-id'),
      ).rejects.toThrow(CompanyAccessDeniedException);
    });

    it('should throw InactiveCompanyException when company is not active', async () => {
      const inactiveCompany = {
        ...mockCompanyUser,
        company: { ...mockCompanyUser.company, status: 'SUSPENDED' },
      };
      authRepository.findCompanyUser.mockResolvedValue(inactiveCompany as never);

      await expect(
        authService.selectCompany('user-id', 'company-id', 'session-id'),
      ).rejects.toThrow(InactiveCompanyException);
    });

    it('should throw InactiveCompanyException when company is deleted', async () => {
      const deletedCompany = {
        ...mockCompanyUser,
        company: { ...mockCompanyUser.company, isDeleted: true },
      };
      authRepository.findCompanyUser.mockResolvedValue(deletedCompany as never);

      await expect(
        authService.selectCompany('user-id', 'company-id', 'session-id'),
      ).rejects.toThrow(InactiveCompanyException);
    });

    it('should throw InactiveCompanyUserException when membership is not active', async () => {
      const inactiveMembership = {
        ...mockCompanyUser,
        status: 'SUSPENDED',
      };
      authRepository.findCompanyUser.mockResolvedValue(inactiveMembership as never);

      await expect(
        authService.selectCompany('user-id', 'company-id', 'session-id'),
      ).rejects.toThrow(InactiveCompanyUserException);
    });
  });

  describe('switchCompany', () => {
    const mockCompanyUser = {
      id: 'cm-id-2',
      companyId: 'company-id-2',
      userId: 'user-id',
      status: 'ACTIVE',
      isActive: true,
      isDeleted: false,
      company: {
        id: 'company-id-2',
        companyCode: 'CMP000002',
        legalName: 'Second Company',
        displayName: null,
        logoUrl: null,
        status: 'ACTIVE',
        isDeleted: false,
      },
      userRoles: [
        {
          role: { id: 'role-id-2', name: 'Manager', code: 'MANAGER' },
        },
      ],
    };

    beforeEach(() => {
      tokenService.generateAccessToken.mockResolvedValue('new-access-token');
      tokenService.generateRefreshToken.mockResolvedValue('new-refresh-token');
      authRepository.updateCompanyUserLastAccessed.mockResolvedValue({} as never);
      authRepository.updateSessionCompanyContext.mockResolvedValue({} as never);
      authRepository.createActivityLog.mockResolvedValue({ id: 'log-id' } as never);
    });

    it('should switch company and return new token pair', async () => {
      authRepository.findCompanyUser.mockResolvedValue(mockCompanyUser as never);

      const result = await authService.switchCompany(
        'user-id',
        'company-id-2',
        'session-id',
        'company-id',
      );

      expect(result.success).toBe(true);
      expect(result.accessToken).toBe('new-access-token');
      expect(result.refreshToken).toBe('new-refresh-token');
      expect(result.companyId).toBe('company-id-2');
      expect(result.companyUserId).toBe('cm-id-2');
      expect(result.activeRoleIds).toEqual(['role-id-2']);
      expect(authRepository.updateSessionCompanyContext).toHaveBeenCalledWith('session-id', {
        activeCompanyId: 'company-id-2',
        activeCompanyUserId: 'cm-id-2',
        lastActivityAt: expect.any(Date),
      });
      expect(eventEmitter.emit).toHaveBeenCalled();
      expect(authRepository.createActivityLog).toHaveBeenCalled();
    });

    it('should throw CompanyAccessDeniedException when user not in target company', async () => {
      authRepository.findCompanyUser.mockResolvedValue(null);

      await expect(
        authService.switchCompany('user-id', 'other-company', 'session-id', 'company-id'),
      ).rejects.toThrow(CompanyAccessDeniedException);
    });

    it('should throw InactiveCompanyException when target company is not active', async () => {
      const inactiveCompany = {
        ...mockCompanyUser,
        company: { ...mockCompanyUser.company, status: 'SUSPENDED' },
      };
      authRepository.findCompanyUser.mockResolvedValue(inactiveCompany as never);

      await expect(
        authService.switchCompany('user-id', 'company-id-2', 'session-id', 'company-id'),
      ).rejects.toThrow(InactiveCompanyException);
    });

    it('should throw InactiveCompanyUserException when membership is inactive', async () => {
      const inactiveMembership = {
        ...mockCompanyUser,
        isActive: false,
      };
      authRepository.findCompanyUser.mockResolvedValue(inactiveMembership as never);

      await expect(
        authService.switchCompany('user-id', 'company-id-2', 'session-id', 'company-id'),
      ).rejects.toThrow(InactiveCompanyUserException);
    });
  });
});
