import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import type { Prisma } from '@prisma/client';
import type { BusinessType } from '@prisma/client';
import type { RegisterDto } from '../dto/auth.dto';
import { PasswordService } from './password.service';
import { AuthRepository } from '../repositories/auth.repository';
import {
  DuplicateEmailException,
  PasswordMismatchException,
  TermsNotAcceptedException,
  WeakPasswordException,
} from '../exceptions/auth.exceptions';
import { normalizeEmail } from '../utils/auth.util';
import { UserRegisteredEvent } from '../events/auth.events';
import { createDefaultCompanySettings } from '../utils/company-settings.util';

export interface RegisterResponse {
  success: true;
  message: string;
  companyId: string;
  userId: string;
  companyUserId: string;
  nextStep: 'VERIFY_EMAIL';
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly passwordService: PasswordService,
    private readonly authRepository: AuthRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async register(dto: RegisterDto): Promise<RegisterResponse> {
    this.logger.log('Registration started');

    if (!dto.acceptTerms) {
      throw new TermsNotAcceptedException();
    }

    if (dto.password !== dto.confirmPassword) {
      throw new PasswordMismatchException();
    }

    const passwordValidation = this.passwordService.validatePasswordStrength(dto.password);
    if (!passwordValidation.isValid) {
      throw new WeakPasswordException(passwordValidation.errors);
    }

    const normalizedEmail = normalizeEmail(dto.email);

    const existingUser = await this.authRepository.findUserByNormalizedEmail(normalizedEmail);
    if (existingUser) {
      throw new DuplicateEmailException();
    }

    const passwordHash = await this.passwordService.hashPassword(dto.password);

    let result: RegisterResponse;

    try {
      result = await this.authRepository.$transaction(async (tx) => {
        const companyCode = await this.getNextCompanyCodeSafe(tx);

        const company = await tx.company.create({
          data: {
            companyCode,
            legalName: dto.companyName,
            displayName: dto.displayName,
            businessType: dto.businessType as BusinessType,
            companyCategory: 'OTHER',
            email: normalizedEmail,
          },
        });

        await tx.companySettings.create({
          data: createDefaultCompanySettings(company.id),
        });

        const user = await tx.user.create({
          data: {
            email: normalizedEmail,
            normalizedEmail,
            username: (normalizedEmail.split('@')[0] ?? normalizedEmail),
            normalizedUsername: (normalizedEmail.split('@')[0] ?? normalizedEmail),
            firstName: dto.firstName,
            lastName: dto.lastName ?? null,
            mobileNumber: dto.mobileNumber,
            passwordHash,
          },
        });

        const employeeCode = `EMP${companyCode.replace('CMP', '')}`;

        const companyUser = await tx.companyUser.create({
          data: {
            companyId: company.id,
            userId: user.id,
            employeeCode,
            officialEmail: normalizedEmail,
            officialMobileNumber: dto.mobileNumber,
          },
        });

        let role = await tx.role.findUnique({
          where: { companyId_code: { companyId: company.id, code: 'COMPANY_ADMIN' } },
        });

        if (!role) {
          role = await tx.role.create({
            data: {
              companyId: company.id,
              name: 'Company Admin',
              code: 'COMPANY_ADMIN',
              displayName: 'Company Admin',
              roleType: 'DEFAULT',
              isSystemRole: true,
              isEditable: false,
              isDeletable: false,
              isAssignable: true,
              hierarchyLevel: 1,
              priority: 1,
            },
          });
        }

        await tx.userRole.create({
          data: {
            companyUserId: companyUser.id,
            roleId: role.id,
            source: 'SELF_ONBOARDING',
            assignedBy: user.id,
          },
        });

        await tx.activityLog.create({
          data: {
            companyId: company.id,
            userId: user.id,
            companyUserId: companyUser.id,
            title: 'User Registered',
            activityType: 'DATA_CREATE',
            module: 'AUTH',
            entityName: 'User',
            entityId: user.id,
            performedAt: new Date(),
          },
        });

        return {
          success: true as const,
          message: 'Registration successful. Please verify your email.',
          companyId: company.id,
          userId: user.id,
          companyUserId: companyUser.id,
          nextStep: 'VERIFY_EMAIL' as const,
        };
      });
    } catch (error) {
      this.logger.error(
        'Registration failed',
        error instanceof Error ? error.message : 'Unknown error',
      );
      throw error;
    }

    this.eventEmitter.emit(
      UserRegisteredEvent.eventName,
      new UserRegisteredEvent(result.userId, normalizedEmail),
    );

    this.logger.log('Registration completed');
    return result;
  }

  private async getNextCompanyCodeSafe(tx: Prisma.TransactionClient): Promise<string> {
    const lastCompany = await tx.company.findFirst({
      where: { isDeleted: false },
      orderBy: { companyCode: 'desc' },
      select: { companyCode: true },
    });

    let nextCounter = 1;
    if (lastCompany?.companyCode) {
      const num = lastCompany.companyCode.replace('CMP', '');
      nextCounter = Number.parseInt(num, 10) + 1;
    }

    const padded = String(nextCounter).padStart(6, '0');
    return `CMP${padded}`;
  }
}
