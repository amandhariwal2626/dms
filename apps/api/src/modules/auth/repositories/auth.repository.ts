import { Injectable } from '@nestjs/common';
import { PrismaService } from '@repo/database';
import type { Prisma } from '@prisma/client';
import { generateCompanyCode, parseCompanyCode } from '../utils/company-code.util';

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findUserByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findUserByNormalizedEmail(normalizedEmail: string) {
    return this.prisma.user.findUnique({ where: { normalizedEmail } });
  }

  async findCompanyByLegalName(legalName: string) {
    return this.prisma.company.findFirst({ where: { legalName } });
  }

  async getNextCompanyCode(): Promise<string> {
    const lastCompany = await this.prisma.company.findFirst({
      where: { isDeleted: false },
      orderBy: { companyCode: 'desc' },
      select: { companyCode: true },
    });

    let nextCounter = 1;
    if (lastCompany?.companyCode) {
      nextCounter = parseCompanyCode(lastCompany.companyCode) + 1;
    }

    return generateCompanyCode(nextCounter);
  }

  async createCompany(data: Prisma.CompanyCreateInput) {
    return this.prisma.company.create({ data });
  }

  async createCompanySettings(data: Prisma.CompanySettingsCreateInput) {
    return this.prisma.companySettings.create({ data });
  }

  async createUser(data: Prisma.UserCreateInput) {
    return this.prisma.user.create({ data });
  }

  async createCompanyUser(data: Prisma.CompanyUserCreateInput) {
    return this.prisma.companyUser.create({ data });
  }

  async findRoleByCode(companyId: string, code: string) {
    return this.prisma.role.findUnique({
      where: { companyId_code: { companyId, code } },
    });
  }

  async createRole(data: Prisma.RoleCreateInput) {
    return this.prisma.role.create({ data });
  }

  async createUserRole(data: Prisma.UserRoleCreateInput) {
    return this.prisma.userRole.create({ data });
  }

  async createActivityLog(data: Prisma.ActivityLogCreateInput) {
    return this.prisma.activityLog.create({ data });
  }

  async $transaction<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(fn);
  }
}
