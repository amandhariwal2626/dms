import { Injectable, Logger } from '@nestjs/common';
import { AuthRepository } from '../repositories/auth.repository';
import type { AuthorizationCompanyContext } from '../types/authorization.types';
import { InactiveCompanyException } from '../exceptions/auth.exceptions';
import {
  CompanyContextMissingException,
  MembershipMissingException,
  InactiveMembershipException,
} from '../exceptions/authorization.exceptions';

@Injectable()
export class CompanyContextResolver {
  private readonly logger = new Logger(CompanyContextResolver.name);

  constructor(private readonly authRepository: AuthRepository) {}

  async resolve(companyId: string, userId: string): Promise<AuthorizationCompanyContext> {
    this.logger.debug(`Resolving company context for user ${userId} in company ${companyId}`);

    const companyUser = await this.authRepository.findCompanyUserWithCompany(companyId, userId);

    if (!companyUser) {
      throw new CompanyContextMissingException();
    }

    if (companyUser.isDeleted) {
      throw new MembershipMissingException();
    }

    if (!companyUser.isActive || companyUser.status !== 'ACTIVE') {
      throw new InactiveMembershipException();
    }

    const company = companyUser.company;

    if (company.isDeleted || !company.isActive || company.status !== 'ACTIVE') {
      throw new InactiveCompanyException();
    }

    return {
      companyId: company.id,
      companyUserId: companyUser.id,
      companyCode: company.companyCode,
      legalName: company.legalName,
      displayName: company.displayName,
      companyStatus: company.status,
      companyIsActive: company.isActive,
      membershipStatus: companyUser.status,
      membershipIsActive: companyUser.isActive,
      isDefaultCompany: companyUser.isDefaultCompany,
      isPrimaryCompany: companyUser.isPrimaryCompany,
    };
  }
}
