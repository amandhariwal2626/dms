import { Injectable } from '@nestjs/common';
import { PrismaService } from '@repo/database';
import type { Prisma, VerificationPurpose } from '@prisma/client';
import { generateCompanyCode, parseCompanyCode } from '../utils/company-code.util';

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  findUserByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findUserByNormalizedEmail(normalizedEmail: string) {
    return this.prisma.user.findUnique({ where: { normalizedEmail } });
  }

  findCompanyByLegalName(legalName: string) {
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

  createCompany(data: Prisma.CompanyCreateInput) {
    return this.prisma.company.create({ data });
  }

  createCompanySettings(data: Prisma.CompanySettingsCreateInput) {
    return this.prisma.companySettings.create({ data });
  }

  createUser(data: Prisma.UserCreateInput) {
    return this.prisma.user.create({ data });
  }

  createCompanyUser(data: Prisma.CompanyUserCreateInput) {
    return this.prisma.companyUser.create({ data });
  }

  findRoleByCode(companyId: string, code: string) {
    return this.prisma.role.findUnique({
      where: { companyId_code: { companyId, code } },
    });
  }

  createRole(data: Prisma.RoleCreateInput) {
    return this.prisma.role.create({ data });
  }

  createUserRole(data: Prisma.UserRoleCreateInput) {
    return this.prisma.userRole.create({ data });
  }

  createActivityLog(data: Prisma.ActivityLogCreateInput) {
    return this.prisma.activityLog.create({ data });
  }

  $transaction<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(fn);
  }

  // ─── Login ─────────────────────────────────────────

  findUserByEmailOrUsername(identifier: string) {
    return this.prisma.user.findFirst({
      where: {
        OR: [{ normalizedEmail: identifier }, { normalizedUsername: identifier }],
      },
    });
  }

  findActiveCompanyMemberships(userId: string) {
    return this.prisma.companyUser.findMany({
      where: {
        userId,
        isActive: true,
        isDeleted: false,
        status: 'ACTIVE',
      },
      include: {
        company: {
          select: {
            id: true,
            companyCode: true,
            legalName: true,
            displayName: true,
          },
        },
      },
    });
  }

  createSession(data: Prisma.SessionCreateInput) {
    return this.prisma.session.create({ data });
  }

  updateLastLogin(
    userId: string,
    data: {
      lastLoginAt: Date;
      lastLoginIp?: string;
      lastLoginUserAgent?: string;
      lastLoginDevice?: string;
    },
  ) {
    return this.prisma.user.update({
      where: { id: userId },
      data,
    });
  }

  resetFailedAttempts(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: 0,
        lockUntil: null,
      },
    });
  }

  incrementFailedAttempts(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: { increment: 1 },
      },
    });
  }

  lockAccount(userId: string, lockUntil: Date) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { lockUntil },
    });
  }

  // ─── Email Verification ────────────────────────────

  createVerificationToken(data: Prisma.EmailVerificationTokenCreateInput) {
    return this.prisma.emailVerificationToken.create({ data });
  }

  findPendingVerification(email: string, purpose: VerificationPurpose) {
    return this.prisma.emailVerificationToken.findFirst({
      where: {
        email,
        purpose,
        isUsed: false,
        isDeleted: false,
        status: 'PENDING',
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  updateVerificationToken(id: string, data: Prisma.EmailVerificationTokenUpdateInput) {
    return this.prisma.emailVerificationToken.update({
      where: { id },
      data,
    });
  }

  invalidatePendingTokens(email: string, purpose: VerificationPurpose) {
    return this.prisma.emailVerificationToken.updateMany({
      where: {
        email,
        purpose,
        isUsed: false,
        isDeleted: false,
        status: 'PENDING',
      },
      data: {
        status: 'EXPIRED',
        isUsed: true,
        usedAt: new Date(),
      },
    });
  }
}
