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

  findRoleByCode(companyId: string, code: string, excludeId?: string) {
    return this.prisma.role.findFirst({
      where: {
        companyId,
        code,
        isDeleted: false,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
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

  // ─── Company Selection ─────────────────────────────

  findCompanyById(companyId: string) {
    return this.prisma.company.findUnique({ where: { id: companyId } });
  }

  findActiveCompanyById(companyId: string) {
    return this.prisma.company.findFirst({
      where: {
        id: companyId,
        isDeleted: false,
        status: 'ACTIVE',
      },
    });
  }

  findCompanyUser(companyId: string, userId: string) {
    return this.prisma.companyUser.findFirst({
      where: {
        companyId,
        userId,
        isDeleted: false,
      },
      include: {
        company: {
          select: {
            id: true,
            companyCode: true,
            legalName: true,
            displayName: true,
            logoUrl: true,
            status: true,
            isDeleted: true,
          },
        },
        userRoles: {
          include: {
            role: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
      },
    });
  }

  findUserCompanies(userId: string) {
    return this.prisma.companyUser.findMany({
      where: {
        userId,
        isActive: true,
        isDeleted: false,
        status: 'ACTIVE',
        company: {
          isDeleted: false,
          status: 'ACTIVE',
        },
      },
      include: {
        company: {
          select: {
            id: true,
            companyCode: true,
            legalName: true,
            displayName: true,
            logoUrl: true,
          },
        },
        userRoles: {
          include: {
            role: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
      },
      orderBy: [
        { isDefaultCompany: 'desc' },
        { lastCompanyLoginAt: { sort: 'desc', nulls: 'last' } },
      ],
    });
  }

  updateCompanyUserLastAccessed(companyUserId: string) {
    return this.prisma.companyUser.update({
      where: { id: companyUserId },
      data: { lastCompanyLoginAt: new Date() },
    });
  }

  updateSessionCompanyContext(
    sessionId: string,
    data: {
      activeCompanyId: string;
      activeCompanyUserId: string;
      lastActivityAt: Date;
    },
  ) {
    const now = new Date();
    return this.prisma.session.update({
      where: { id: sessionId },
      data: {
        lastActivityAt: data.lastActivityAt,
        metadata: {
          activeCompanyId: data.activeCompanyId,
          activeCompanyUserId: data.activeCompanyUserId,
          lastCompanySwitchAt: now.toISOString(),
        },
      },
    });
  }

  // ─── Refresh Token ────────────────────────────────

  findSessionById(sessionId: string) {
    return this.prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        user: {
          select: {
            id: true,
            isActive: true,
            isDeleted: true,
            status: true,
            emailVerified: true,
            refreshTokenVersion: true,
            lockUntil: true,
          },
        },
      },
    });
  }

  findCompanyUserByUserId(userId: string) {
    return this.prisma.companyUser.findFirst({
      where: {
        userId,
        isDeleted: false,
        isActive: true,
        status: 'ACTIVE',
        company: { isDeleted: false, status: 'ACTIVE' },
      },
      include: {
        company: {
          select: {
            id: true,
            status: true,
            isDeleted: true,
          },
        },
      },
    });
  }

  updateSessionRotation(
    sessionId: string,
    data: {
      refreshTokenHash: string;
      refreshTokenVersion: number;
      lastActivityAt: Date;
      expiresAt: Date | null;
    },
  ) {
    return this.prisma.session.update({
      where: { id: sessionId },
      data: {
        refreshTokenHash: data.refreshTokenHash,
        refreshTokenVersion: data.refreshTokenVersion,
        lastActivityAt: data.lastActivityAt,
        expiresAt: data.expiresAt,
        metadata: {
          lastRefreshAt: new Date().toISOString(),
        },
      },
    });
  }

  revokeSession(
    sessionId: string,
    data: {
      isRevoked: boolean;
      revokedAt: Date;
      revocationReason: string;
      status: string;
    },
  ) {
    return this.prisma.session.update({
      where: { id: sessionId },
      data: {
        isRevoked: data.isRevoked,
        revokedAt: data.revokedAt,
        revocationReason: data.revocationReason,
        status: data.status as never,
      },
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

  // ─── Password Reset ───────────────────────────────

  findPasswordResetToken(email: string) {
    return this.prisma.emailVerificationToken.findFirst({
      where: {
        email,
        purpose: 'RESET_PASSWORD',
        isDeleted: false,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  findVerifiedPasswordResetToken(email: string) {
    return this.prisma.emailVerificationToken.findFirst({
      where: {
        email,
        purpose: 'RESET_PASSWORD',
        status: 'VERIFIED',
        isUsed: false,
        isDeleted: false,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  updateUserPassword(
    userId: string,
    data: {
      passwordHash: string;
      passwordChangedAt: Date;
      passwordResetRequired?: boolean;
      forcePasswordChange?: boolean;
      refreshTokenVersion?: number;
    },
  ) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: data.passwordHash,
        passwordChangedAt: data.passwordChangedAt,
        ...(data.passwordResetRequired !== undefined
          ? { passwordResetRequired: data.passwordResetRequired }
          : {}),
        ...(data.forcePasswordChange !== undefined
          ? { forcePasswordChange: data.forcePasswordChange }
          : {}),
        ...(data.refreshTokenVersion !== undefined
          ? { refreshTokenVersion: data.refreshTokenVersion }
          : {}),
      },
    });
  }

  revokeAllUserSessions(userId: string) {
    return this.prisma.session.updateMany({
      where: {
        userId,
        isRevoked: false,
        status: 'ACTIVE',
        isDeleted: false,
      },
      data: {
        isRevoked: true,
        revokedAt: new Date(),
        revocationReason: 'PASSWORD_CHANGED',
        status: 'REVOKED',
      },
    });
  }

  revokeOtherSessions(userId: string, excludeSessionId: string) {
    return this.prisma.session.updateMany({
      where: {
        userId,
        id: { not: excludeSessionId },
        isRevoked: false,
        status: 'ACTIVE',
        isDeleted: false,
      },
      data: {
        isRevoked: true,
        revokedAt: new Date(),
        revocationReason: 'PASSWORD_CHANGED_OTHER_DEVICES',
        status: 'REVOKED',
      },
    });
  }

  // ─── Profile ───────────────────────────────────────

  findUserWithProfile(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        companyUsers: {
          where: { isDeleted: false, status: 'ACTIVE' },
          include: {
            company: true,
            userRoles: {
              include: {
                role: true,
              },
            },
          },
        },
      },
    });
  }

  updateUser(userId: string, data: Prisma.UserUpdateInput) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { ...data, updatedAt: new Date() },
    });
  }

  findCurrentSession(sessionId: string) {
    return this.prisma.session.findUnique({
      where: { id: sessionId },
      select: {
        id: true,
        loginAt: true,
        lastActivityAt: true,
        deviceName: true,
        browser: true,
        operatingSystem: true,
      },
    });
  }

  createFileAttachment(data: Prisma.FileAttachmentCreateInput) {
    return this.prisma.fileAttachment.create({ data });
  }

  // ─── Invitation ────────────────────────────────────

  findInvitationByToken(token: string) {
    return this.prisma.emailVerificationToken.findFirst({
      where: {
        token,
        purpose: 'INVITE',
        isDeleted: false,
      },
    });
  }

  findInvitationById(id: string) {
    return this.prisma.emailVerificationToken.findFirst({
      where: {
        id,
        purpose: 'INVITE',
        isDeleted: false,
      },
    });
  }

  findPendingInvitation(email: string, companyId: string) {
    return this.prisma.emailVerificationToken.findFirst({
      where: {
        email,
        purpose: 'INVITE',
        isUsed: false,
        isDeleted: false,
        status: 'PENDING',
        metadata: {
          path: ['companyId'],
          equals: companyId,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  findInvitationsByCompany(companyId: string) {
    return this.prisma.emailVerificationToken.findMany({
      where: {
        purpose: 'INVITE',
        isDeleted: false,
        status: { in: ['PENDING', 'VERIFIED'] },
        metadata: {
          path: ['companyId'],
          equals: companyId,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  findRoleById(roleId: string) {
    return this.prisma.role.findUnique({ where: { id: roleId } });
  }

  findRolesByIds(roleIds: string[]) {
    return this.prisma.role.findMany({
      where: { id: { in: roleIds }, isDeleted: false },
    });
  }

  async getNextEmployeeCode(companyId: string): Promise<string> {
    const lastCompanyUser = await this.prisma.companyUser.findFirst({
      where: { companyId, isDeleted: false },
      orderBy: { employeeCode: 'desc' },
      select: { employeeCode: true },
    });

    let nextNumber = 1;
    if (lastCompanyUser?.employeeCode) {
      const numStr = lastCompanyUser.employeeCode.replace('EMP', '');
      nextNumber = Number.parseInt(numStr, 10) + 1;
    }

    return `EMP${String(nextNumber).padStart(6, '0')}`;
  }

  findCompanyUsersByEmail(email: string) {
    return this.prisma.companyUser.findMany({
      where: {
        officialEmail: email,
        isDeleted: false,
      },
    });
  }

  companyUserExists(companyId: string, userId: string) {
    return this.prisma.companyUser.findFirst({
      where: {
        companyId,
        userId,
        isDeleted: false,
      },
    });
  }

  // ─── Role Management ────────────────────────────

  findRoles(params: {
    where: Prisma.RoleWhereInput;
    skip: number;
    take: number;
    orderBy: Prisma.RoleOrderByWithRelationInput;
  }) {
    return this.prisma.role.findMany(params);
  }

  countRoles(where: Prisma.RoleWhereInput) {
    return this.prisma.role.count({ where });
  }

  findRoleWithDetails(id: string) {
    return this.prisma.role.findFirst({
      where: { id, isDeleted: false },
      include: {
        parentRole: {
          select: { id: true, name: true, code: true, displayName: true },
        },
        childRoles: {
          where: { isDeleted: false },
          select: { id: true },
        },
        _count: {
          select: {
            userRoles: {
              where: { isDeleted: false },
            },
          },
        },
      },
    });
  }

  findRoleByName(companyId: string, name: string, excludeId?: string) {
    return this.prisma.role.findFirst({
      where: {
        companyId,
        name,
        isDeleted: false,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
  }

  updateRole(id: string, data: Prisma.RoleUpdateInput) {
    return this.prisma.role.update({
      where: { id },
      data,
    });
  }

  softDeleteRole(id: string, deletedBy: string) {
    return this.prisma.role.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy,
        isActive: false,
      },
    });
  }

  countActiveRoleUsers(roleId: string) {
    return this.prisma.userRole.count({
      where: {
        roleId,
        isDeleted: false,
        isActive: true,
        companyUser: {
          isDeleted: false,
          isActive: true,
        },
      },
    });
  }

  findRoleWithActiveUsers(roleId: string) {
    return this.prisma.role.findFirst({
      where: { id: roleId, isDeleted: false },
      include: {
        _count: {
          select: {
            userRoles: {
              where: { isDeleted: false, isActive: true },
            },
          },
        },
      },
    });
  }

  findAdminRoleByCompany(companyId: string) {
    return this.prisma.role.findFirst({
      where: {
        companyId,
        code: 'COMPANY_ADMIN',
        isDeleted: false,
      },
    });
  }

  countActiveAdminRoles(companyId: string, excludeRoleId: string) {
    return this.prisma.role.count({
      where: {
        companyId,
        code: 'COMPANY_ADMIN',
        isDeleted: false,
        isActive: true,
        status: 'ACTIVE',
        id: { not: excludeRoleId },
      },
    });
  }

  findRolesForCompany(companyId: string) {
    return this.prisma.role.findMany({
      where: {
        companyId,
        isDeleted: false,
      },
      select: {
        id: true,
        name: true,
        code: true,
        displayName: true,
        roleType: true,
        parentRoleId: true,
        isSystemRole: true,
      },
    });
  }

  // ─── Permission Management ────────────────────────

  findPermissions(params: {
    where: Prisma.PermissionWhereInput;
    skip: number;
    take: number;
    orderBy: Prisma.PermissionOrderByWithRelationInput;
  }) {
    return this.prisma.permission.findMany(params);
  }

  countPermissions(where: Prisma.PermissionWhereInput) {
    return this.prisma.permission.count({ where });
  }

  findPermissionById(id: string) {
    return this.prisma.permission.findFirst({
      where: { id, isDeleted: false },
    });
  }

  findPermissionByCode(code: string, excludeId?: string) {
    return this.prisma.permission.findFirst({
      where: {
        code,
        isDeleted: false,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
  }

  findPermissionByName(name: string, excludeId?: string) {
    return this.prisma.permission.findFirst({
      where: {
        name,
        isDeleted: false,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
  }

  findModuleById(id: string) {
    return this.prisma.module.findFirst({
      where: { id, isDeleted: false },
    });
  }

  createPermission(data: Prisma.PermissionCreateInput) {
    return this.prisma.permission.create({ data });
  }

  updatePermission(id: string, data: Prisma.PermissionUpdateInput) {
    return this.prisma.permission.update({
      where: { id },
      data,
    });
  }

  softDeletePermission(id: string, deletedBy: string) {
    return this.prisma.permission.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy,
        isActive: false,
      },
    });
  }

  countPermissionRoleAssignments(permissionId: string) {
    return this.prisma.rolePermission.count({
      where: {
        permissionId,
        isDeleted: false,
      },
    });
  }

  findPermissionsByModule(module: string) {
    return this.prisma.permission.findMany({
      where: {
        module,
        isDeleted: false,
      },
      orderBy: [{ feature: 'asc' }, { displayOrder: 'asc' }],
    });
  }
}
