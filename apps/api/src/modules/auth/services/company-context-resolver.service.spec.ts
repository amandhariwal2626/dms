/* eslint-disable @typescript-eslint/no-explicit-any */
import { Test, type TestingModule } from '@nestjs/testing';
import { CompanyContextResolver } from './company-context-resolver.service';
import { AuthRepository } from '../repositories/auth.repository';
import {
  CompanyContextMissingException,
  MembershipMissingException,
  InactiveMembershipException,
} from '../exceptions/authorization.exceptions';
import { InactiveCompanyException } from '../exceptions/auth.exceptions';

describe('CompanyContextResolver', () => {
  let service: CompanyContextResolver;
  let authRepository: jest.Mocked<AuthRepository>;

  function createMock(
    overrides: Record<string, unknown> = {},
    companyOverrides: Record<string, unknown> = {},
  ): unknown {
    return {
      id: 'cu-1',
      companyId: 'company-1',
      userId: 'user-1',
      isDefaultCompany: true,
      isPrimaryCompany: true,
      status: 'ACTIVE',
      isActive: true,
      isDeleted: false,
      company: {
        id: 'company-1',
        companyCode: 'C001',
        legalName: 'Test Corp',
        displayName: 'Test Corp Display',
        status: 'ACTIVE',
        isActive: true,
        isDeleted: false,
        ...companyOverrides,
      },
      ...overrides,
    };
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompanyContextResolver,
        {
          provide: AuthRepository,
          useValue: {
            findCompanyUserWithCompany: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CompanyContextResolver>(CompanyContextResolver);
    authRepository = module.get(AuthRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should resolve company context successfully', async () => {
    authRepository.findCompanyUserWithCompany.mockResolvedValue(createMock() as any);

    const result = await service.resolve('company-1', 'user-1');

    expect(result.companyId).toBe('company-1');
    expect(result.companyUserId).toBe('cu-1');
    expect(result.companyCode).toBe('C001');
    expect(result.legalName).toBe('Test Corp');
    expect(result.companyIsActive).toBe(true);
    expect(result.membershipIsActive).toBe(true);
    expect(result.isDefaultCompany).toBe(true);
    expect(result.isPrimaryCompany).toBe(true);
  });

  it('should throw CompanyContextMissingException when company user not found', async () => {
    authRepository.findCompanyUserWithCompany.mockResolvedValue(null);

    await expect(service.resolve('company-1', 'user-1')).rejects.toThrow(
      CompanyContextMissingException,
    );
  });

  it('should throw MembershipMissingException when membership is deleted', async () => {
    authRepository.findCompanyUserWithCompany.mockResolvedValue(
      createMock({ isDeleted: true }) as any,
    );
    await expect(service.resolve('company-1', 'user-1')).rejects.toThrow(
      MembershipMissingException,
    );
  });

  it('should throw InactiveMembershipException when membership is inactive', async () => {
    authRepository.findCompanyUserWithCompany.mockResolvedValue(
      createMock({ isActive: false, status: 'INACTIVE' }) as any,
    );
    await expect(service.resolve('company-1', 'user-1')).rejects.toThrow(
      InactiveMembershipException,
    );
  });

  it('should throw InactiveMembershipException when membership status is not ACTIVE', async () => {
    authRepository.findCompanyUserWithCompany.mockResolvedValue(
      createMock({ isActive: true, status: 'SUSPENDED' }) as any,
    );
    await expect(service.resolve('company-1', 'user-1')).rejects.toThrow(
      InactiveMembershipException,
    );
  });

  it('should throw InactiveCompanyException when company is deleted', async () => {
    authRepository.findCompanyUserWithCompany.mockResolvedValue(
      createMock({}, { isDeleted: true }) as any,
    );
    await expect(service.resolve('company-1', 'user-1')).rejects.toThrow(InactiveCompanyException);
  });

  it('should throw InactiveCompanyException when company is inactive', async () => {
    authRepository.findCompanyUserWithCompany.mockResolvedValue(
      createMock({}, { isActive: false, status: 'INACTIVE' }) as any,
    );
    await expect(service.resolve('company-1', 'user-1')).rejects.toThrow(InactiveCompanyException);
  });

  it('should throw InactiveCompanyException when company status is not ACTIVE', async () => {
    authRepository.findCompanyUserWithCompany.mockResolvedValue(
      createMock({}, { isActive: true, status: 'SUSPENDED' }) as any,
    );
    await expect(service.resolve('company-1', 'user-1')).rejects.toThrow(InactiveCompanyException);
  });
});
