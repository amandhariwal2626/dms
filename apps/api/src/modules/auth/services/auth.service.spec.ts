import { Test, type TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import type { Prisma, User } from '@prisma/client';
import { AuthService } from './auth.service';
import { PasswordService } from './password.service';
import { AuthRepository } from '../repositories/auth.repository';
import {
  DuplicateEmailException,
  PasswordMismatchException,
  TermsNotAcceptedException,
  WeakPasswordException,
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
          provide: AuthRepository,
          useValue: {
            findUserByNormalizedEmail: jest.fn(),
            findCompanyByLegalName: jest.fn(),
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
      } as User);

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
});
