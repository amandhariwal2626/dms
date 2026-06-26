import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import type { Prisma } from '@prisma/client';
import type { BusinessType } from '@prisma/client';
import type { RegisterDto, LoginDto } from '../dto/auth.dto';
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
  ReplayAttackException,
  SessionRevokedException,
  SessionExpiredException,
  InvalidTokenException,
} from '../exceptions/auth.exceptions';
import { normalizeEmail, normalizeUsername } from '../utils/auth.util';
import {
  UserRegisteredEvent,
  UserLoggedInEvent,
  CompanySelectedEvent,
  CompanySwitchedEvent,
  TokenRefreshedEvent,
  SessionRevokedEvent,
} from '../events/auth.events';
import { createDefaultCompanySettings } from '../utils/company-settings.util';
import { LOGIN_CONSTANTS } from '../constants/auth.constants';
import { addMinutes, parseExpiry } from '../utils/date.util';

export interface RegisterResponse {
  success: true;
  message: string;
  companyId: string;
  userId: string;
  companyUserId: string;
  nextStep: 'VERIFY_EMAIL';
}

export interface LoginCompanyInfo {
  companyId: string;
  companyCode: string;
  legalName: string;
  displayName: string;
  isDefault: boolean;
}

export interface RefreshResponse {
  success: true;
  message: string;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginResponse {
  success: true;
  message: string;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string | null;
    displayName: string | null;
  };
  companies: LoginCompanyInfo[];
  defaultCompany: LoginCompanyInfo;
  requiresCompanySelection: boolean;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService,
    private readonly jwtConfigService: JwtConfigService,
    private readonly hashService: HashService,
    private readonly sessionTokenService: SessionTokenService,
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
            username: normalizedEmail.split('@')[0] ?? normalizedEmail,
            normalizedUsername: normalizedEmail.split('@')[0] ?? normalizedEmail,
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
            isPrimaryCompany: true,
            isDefaultCompany: true,
            status: 'ACTIVE',
            isActive: true,
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

  async login(dto: LoginDto): Promise<LoginResponse> {
    this.logger.log('Login started');

    const identifier = dto.emailOrUsername.toLowerCase().trim();
    const isEmail = identifier.includes('@');
    const normalizedIdentifier = isEmail
      ? normalizeEmail(identifier)
      : normalizeUsername(identifier);

    const user = await this.authRepository.findUserByEmailOrUsername(normalizedIdentifier);

    if (!user) {
      this.logger.warn(`Login failed: user not found for ${normalizedIdentifier}`);
      throw new InvalidCredentialsException();
    }

    const passwordValid = await this.passwordService.verifyPassword(
      dto.password,
      user.passwordHash,
    );
    if (!passwordValid) {
      this.logger.warn(`Login failed: invalid password for user ${user.id}`);

      const newAttemptCount = user.failedLoginAttempts + 1;
      await this.authRepository.incrementFailedAttempts(user.id);

      if (newAttemptCount >= LOGIN_CONSTANTS.MAX_FAILED_ATTEMPTS) {
        const lockUntil = addMinutes(new Date(), LOGIN_CONSTANTS.LOCKOUT_DURATION_MINUTES);
        await this.authRepository.lockAccount(user.id, lockUntil);
        this.logger.warn(`Account locked for user ${user.id} until ${lockUntil.toISOString()}`);
      }

      throw new InvalidCredentialsException();
    }

    if (user.isDeleted) {
      this.logger.warn(`Login failed: deleted user ${user.id}`);
      throw new InactiveUserException();
    }

    if (user.status !== 'ACTIVE') {
      this.logger.warn(`Login failed: inactive user ${user.id} (status: ${user.status})`);
      throw new InactiveUserException();
    }

    if (!user.isActive) {
      this.logger.warn(`Login failed: inactive user ${user.id}`);
      throw new InactiveUserException();
    }

    if (!user.emailVerified) {
      this.logger.warn(`Login failed: email not verified for user ${user.id}`);
      throw new EmailNotVerifiedException();
    }

    if (user.lockUntil && user.lockUntil > new Date()) {
      this.logger.warn(`Login failed: locked account for user ${user.id}`);
      throw new AccountLockedException();
    }

    const companyMemberships = await this.authRepository.findActiveCompanyMemberships(user.id);

    if (companyMemberships.length === 0) {
      this.logger.warn(`Login failed: no active company memberships for user ${user.id}`);
      throw new InvalidCredentialsException();
    }

    const sessionJwtId = this.sessionTokenService.generateAccessTokenIdentifier();
    const refreshTokenIdentifier = this.sessionTokenService.generateRefreshTokenIdentifier();
    const refreshTokenVersion = user.refreshTokenVersion;

    const sessionResult = await this.authRepository.$transaction(async (tx) => {
      const session = await tx.session.create({
        data: {
          userId: user.id,
          accessTokenId: sessionJwtId,
          refreshTokenHash: this.hashService.hash(refreshTokenIdentifier),
          refreshTokenVersion,
          jwtId: sessionJwtId,
          deviceId: dto.deviceInfo?.deviceId ?? null,
          deviceName: dto.deviceInfo?.deviceName ?? null,
          deviceType: null,
          operatingSystem: dto.deviceInfo?.operatingSystem ?? null,
          osVersion: dto.deviceInfo?.osVersion ?? null,
          browser: dto.deviceInfo?.browser ?? null,
          browserVersion: dto.deviceInfo?.browserVersion ?? null,
          ipAddress: null,
          userAgent: null,
          loginAt: new Date(),
          lastActivityAt: new Date(),
          isCurrentSession: true,
          rememberMe: dto.rememberMe ?? false,
          status: 'ACTIVE',
        },
      });

      await tx.user.update({
        where: { id: user.id },
        data: {
          lastLoginAt: new Date(),
          lastLoginIp: null,
          lastLoginUserAgent: null,
          lastLoginDevice: dto.deviceInfo?.deviceName ?? null,
          failedLoginAttempts: 0,
          lockUntil: null,
        },
      });

      return { session };
    });

    const tokenPair = await this.tokenService.generateTokenPair({
      userId: user.id,
      sessionId: sessionResult.session.id,
      tokenVersion: 0,
      refreshTokenVersion,
    });

    const defaultMembership =
      companyMemberships.find((m) => m.isDefaultCompany) ?? companyMemberships[0];
    if (!defaultMembership) {
      throw new InvalidCredentialsException();
    }

    const companies: LoginCompanyInfo[] = companyMemberships.map((m) => ({
      companyId: m.company.id,
      companyCode: m.company.companyCode,
      legalName: m.company.legalName,
      displayName: m.company.displayName || m.company.legalName,
      isDefault: m.isDefaultCompany,
    }));

    const defaultCompany: LoginCompanyInfo = {
      companyId: defaultMembership.company.id,
      companyCode: defaultMembership.company.companyCode,
      legalName: defaultMembership.company.legalName,
      displayName: defaultMembership.company.displayName || defaultMembership.company.legalName,
      isDefault: true,
    };

    const accessExpiryMs = parseExpiry(this.jwtConfigService.accessToken.expiresIn);
    const expiresIn = Math.floor(accessExpiryMs / 1000);

    this.eventEmitter.emit(
      UserLoggedInEvent.eventName,
      new UserLoggedInEvent(user.id, sessionResult.session.id, undefined),
    );

    await this.authRepository.createActivityLog({
      company: { connect: { id: defaultMembership.company.id } },
      user: { connect: { id: user.id } },
      companyUser: { connect: { id: defaultMembership.id } },
      title: 'User Logged In',
      activityType: 'LOGIN',
      module: 'AUTH',
      entityName: 'User',
      entityId: user.id,
      performedAt: new Date(),
    });

    this.logger.log(`Login successful for user ${user.id}`);

    return {
      success: true,
      message: 'Login successful',
      accessToken: tokenPair.accessToken,
      refreshToken: tokenPair.refreshToken,
      expiresIn,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        displayName: user.displayName,
      },
      companies,
      defaultCompany,
      requiresCompanySelection: companies.length > 1,
    };
  }

  async getUserCompanies(userId: string) {
    this.logger.log(`Fetching companies for user ${userId}`);

    const memberships = await this.authRepository.findUserCompanies(userId);

    return memberships.map((m) => ({
      companyId: m.company.id,
      companyCode: m.company.companyCode,
      companyName: m.company.legalName,
      displayName: m.company.displayName || m.company.legalName,
      logo: m.company.logoUrl,
      companyUserId: m.id,
      roles: m.userRoles.map((ur) => ({
        roleId: ur.role.id,
        name: ur.role.name,
        code: ur.role.code,
      })),
      isDefaultCompany: m.isDefaultCompany,
      lastAccessedAt: m.lastCompanyLoginAt,
    }));
  }

  async selectCompany(userId: string, companyId: string, sessionId: string) {
    this.logger.log(`Company selection: user ${userId} selecting company ${companyId}`);

    const companyUser = await this.authRepository.findCompanyUser(companyId, userId);

    if (!companyUser) {
      this.logger.warn(`Company selection failed: user ${userId} not in company ${companyId}`);
      throw new CompanyAccessDeniedException();
    }

    if (companyUser.company.status !== 'ACTIVE' || companyUser.company.isDeleted) {
      this.logger.warn(`Company selection failed: company ${companyId} is not active`);
      throw new InactiveCompanyException();
    }

    if (companyUser.status !== 'ACTIVE' || !companyUser.isActive || companyUser.isDeleted) {
      this.logger.warn(`Company selection failed: membership ${companyUser.id} is not active`);
      throw new InactiveCompanyUserException();
    }

    await this.authRepository.updateCompanyUserLastAccessed(companyUser.id);

    const activeRoleIds = companyUser.userRoles.map((ur) => ur.role.id);

    const newAccessToken = await this.tokenService.generateAccessToken({
      userId,
      sessionId,
      tokenVersion: 0,
      companyId,
      companyUserId: companyUser.id,
    });

    const expiresIn = Math.floor(parseExpiry(this.jwtConfigService.accessToken.expiresIn) / 1000);

    await this.authRepository.updateSessionCompanyContext(sessionId, {
      activeCompanyId: companyId,
      activeCompanyUserId: companyUser.id,
      lastActivityAt: new Date(),
    });

    this.eventEmitter.emit(
      CompanySelectedEvent.eventName,
      new CompanySelectedEvent(userId, companyId, sessionId),
    );

    await this.authRepository.createActivityLog({
      company: { connect: { id: companyId } },
      user: { connect: { id: userId } },
      companyUser: { connect: { id: companyUser.id } },
      title: 'Company Selected',
      activityType: 'LOGIN',
      module: 'AUTH',
      entityName: 'Company',
      entityId: companyId,
      performedAt: new Date(),
    });

    this.logger.log(`Company selected: user ${userId} -> company ${companyId}`);

    return {
      success: true as const,
      message: 'Company selected successfully',
      accessToken: newAccessToken,
      expiresIn,
      companyId,
      companyUserId: companyUser.id,
      activeRoleIds,
    };
  }

  async switchCompany(
    userId: string,
    companyId: string,
    sessionId: string,
    currentCompanyId: string,
  ) {
    this.logger.log(
      `Company switch: user ${userId} switching from ${currentCompanyId} to ${companyId}`,
    );

    const companyUser = await this.authRepository.findCompanyUser(companyId, userId);

    if (!companyUser) {
      this.logger.warn(`Company switch failed: user ${userId} not in company ${companyId}`);
      throw new CompanyAccessDeniedException();
    }

    if (companyUser.company.status !== 'ACTIVE' || companyUser.company.isDeleted) {
      this.logger.warn(`Company switch failed: target company ${companyId} is not active`);
      throw new InactiveCompanyException();
    }

    if (companyUser.status !== 'ACTIVE' || !companyUser.isActive || companyUser.isDeleted) {
      this.logger.warn(`Company switch failed: membership ${companyUser.id} is not active`);
      throw new InactiveCompanyUserException();
    }

    await this.authRepository.updateCompanyUserLastAccessed(companyUser.id);

    const newRefreshToken = await this.tokenService.generateRefreshToken({
      userId,
      sessionId,
      refreshTokenVersion: 0,
    });

    const newAccessToken = await this.tokenService.generateAccessToken({
      userId,
      sessionId,
      tokenVersion: 0,
      companyId,
      companyUserId: companyUser.id,
    });

    const accessExpiryMs = parseExpiry(this.jwtConfigService.accessToken.expiresIn);
    const expiresIn = Math.floor(accessExpiryMs / 1000);

    const activeRoleIds = companyUser.userRoles.map((ur) => ur.role.id);

    await this.authRepository.updateSessionCompanyContext(sessionId, {
      activeCompanyId: companyId,
      activeCompanyUserId: companyUser.id,
      lastActivityAt: new Date(),
    });

    this.eventEmitter.emit(
      CompanySwitchedEvent.eventName,
      new CompanySwitchedEvent(userId, currentCompanyId, companyId),
    );

    await this.authRepository.createActivityLog({
      company: { connect: { id: companyId } },
      user: { connect: { id: userId } },
      companyUser: { connect: { id: companyUser.id } },
      title: 'Company Switched',
      activityType: 'LOGIN',
      module: 'AUTH',
      entityName: 'Company',
      entityId: companyId,
      performedAt: new Date(),
    });

    this.logger.log(`Company switched: user ${userId} from ${currentCompanyId} to ${companyId}`);

    return {
      success: true as const,
      message: 'Company switched successfully',
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn,
      companyId,
      companyUserId: companyUser.id,
      activeRoleIds,
    };
  }

  async refresh(tokenValue: string): Promise<RefreshResponse> {
    this.logger.log('Refresh started');

    const decoded = this.tokenService.decodeToken(tokenValue) as {
      sub: string;
      sessionId: string;
      refreshTokenVersion: number;
    } | null;
    if (!decoded || typeof decoded === 'string' || !decoded.sessionId) {
      this.logger.warn('Refresh failed: invalid refresh token');
      throw new InvalidTokenException();
    }

    const sessionId = decoded.sessionId;
    const session = await this.authRepository.findSessionById(sessionId);

    if (!session) {
      this.logger.warn(`Refresh failed: session ${sessionId} not found`);
      throw new SessionExpiredException();
    }

    if (session.isRevoked || session.status !== 'ACTIVE') {
      this.logger.warn(`Refresh failed: session ${sessionId} is revoked or inactive`);
      throw new SessionRevokedException();
    }

    if (session.expiresAt && new Date(session.expiresAt) <= new Date()) {
      this.logger.warn(`Refresh failed: session ${sessionId} has expired`);
      throw new SessionExpiredException();
    }

    const user = session.user;
    if (user.isDeleted || user.status !== 'ACTIVE' || !user.isActive) {
      this.logger.warn(`Refresh failed: user ${user.id} is not active`);
      throw new InactiveUserException();
    }

    if (user.lockUntil && new Date(user.lockUntil) > new Date()) {
      this.logger.warn(`Refresh failed: user ${user.id} account is locked`);
      throw new AccountLockedException();
    }

    const payload = await this.tokenService.verifyRefreshToken(tokenValue);

    if (payload.refreshTokenVersion !== user.refreshTokenVersion) {
      this.logger.warn(`Refresh failed: token version mismatch for session ${sessionId}`);
      await this.authRepository.revokeSession(sessionId, {
        isRevoked: true,
        revokedAt: new Date(),
        revocationReason: 'TOKEN_VERSION_MISMATCH',
        status: 'REVOKED',
      });
      this.eventEmitter.emit(
        SessionRevokedEvent.eventName,
        new SessionRevokedEvent(user.id, sessionId, 'TOKEN_VERSION_MISMATCH'),
      );
      throw new ReplayAttackException();
    }

    const hashMatch = this.hashService.compare(tokenValue, session.refreshTokenHash);
    if (!hashMatch) {
      this.logger.warn(`Refresh failed: refresh token hash mismatch for session ${sessionId}`);
      await this.authRepository.revokeSession(sessionId, {
        isRevoked: true,
        revokedAt: new Date(),
        revocationReason: 'REFRESH_TOKEN_HASH_MISMATCH',
        status: 'REVOKED',
      });
      this.eventEmitter.emit(
        SessionRevokedEvent.eventName,
        new SessionRevokedEvent(user.id, sessionId, 'REFRESH_TOKEN_REUSE'),
      );
      throw new ReplayAttackException();
    }

    const companyUser = await this.authRepository.findCompanyUserByUserId(user.id);
    if (companyUser) {
      if (companyUser.company.status !== 'ACTIVE' || companyUser.company.isDeleted) {
        this.logger.warn(`Refresh failed: company ${companyUser.company.id} is not active`);
        throw new InactiveCompanyException();
      }
    }

    const newRefreshTokenIdentifier = this.sessionTokenService.generateRefreshTokenIdentifier();
    const newRefreshTokenHash = this.hashService.hash(newRefreshTokenIdentifier);
    const newRefreshTokenVersion = user.refreshTokenVersion + 1;
    const now = new Date();

    const newRefreshToken = await this.tokenService.generateRefreshToken({
      userId: user.id,
      sessionId,
      refreshTokenVersion: newRefreshTokenVersion,
    });

    const newAccessToken = await this.tokenService.generateAccessToken({
      userId: user.id,
      sessionId,
      tokenVersion: 0,
      ...(companyUser?.company.id !== undefined ? { companyId: companyUser.company.id } : {}),
      ...(companyUser?.id !== undefined ? { companyUserId: companyUser.id } : {}),
    });

    const refreshExpiryMs = parseExpiry(this.jwtConfigService.refreshToken.expiresIn);
    const newExpiresAt = new Date(now.getTime() + refreshExpiryMs);

    await this.authRepository.$transaction(async (tx) => {
      const existing = await tx.session.findUnique({
        where: { id: sessionId },
        select: { metadata: true },
      });

      const existingMetadata = (existing?.metadata as Record<string, unknown> | null) ?? {};

      await tx.session.update({
        where: { id: sessionId },
        data: {
          refreshTokenHash: newRefreshTokenHash,
          refreshTokenVersion: newRefreshTokenVersion,
          lastActivityAt: now,
          expiresAt: newExpiresAt,
          metadata: {
            ...existingMetadata,
            lastRefreshAt: now.toISOString(),
          },
        },
      });

      await tx.user.update({
        where: { id: user.id },
        data: { refreshTokenVersion: newRefreshTokenVersion },
      });
    });

    const accessExpiryMs = parseExpiry(this.jwtConfigService.accessToken.expiresIn);
    const expiresIn = Math.floor(accessExpiryMs / 1000);

    this.eventEmitter.emit(
      TokenRefreshedEvent.eventName,
      new TokenRefreshedEvent(user.id, sessionId),
    );

    await this.authRepository.createActivityLog({
      user: { connect: { id: user.id } },
      title: 'Session Refreshed',
      activityType: 'LOGIN',
      module: 'AUTH',
      entityName: 'Session',
      entityId: sessionId,
      performedAt: now,
    });

    this.logger.log(`Refresh successful for user ${user.id}`);

    return {
      success: true as const,
      message: 'Token refreshed successfully',
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn,
    };
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
