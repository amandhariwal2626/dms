import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import type { Prisma } from '@prisma/client';
import type { Gender, Language, MaritalStatus, Timezone } from '@prisma/client';
import { AuthRepository } from '../repositories/auth.repository';
import { PasswordService } from './password.service';
import type { UpdateProfileDto, ChangePasswordDto, UpdatePreferencesDto } from '../dto/profile.dto';
import {
  ProfileUpdatedEvent,
  ProfilePhotoUploadedEvent,
  PreferencesUpdatedEvent,
} from '../events/profile.events';
import { PasswordChangedEvent } from '../events/auth.events';
import {
  InvalidCredentialsException,
  WeakPasswordException,
  PasswordMismatchException,
  InvalidFileException,
  FileTooLargeException,
} from '../exceptions/auth.exceptions';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { cwd } from 'process';
import { randomUUID } from 'crypto';

export interface FileUpload {
  buffer: Buffer;
  mimetype: string;
  size: number;
  originalname: string;
}

export interface ProfileResponse {
  id: string;
  firstName: string;
  middleName: string | null;
  lastName: string | null;
  displayName: string | null;
  username: string;
  email: string;
  mobileNumber: string | null;
  alternateMobileNumber: string | null;
  profilePhotoUrl: string | null;
  gender: string | null;
  dateOfBirth: string | null;
  bloodGroup: string | null;
  maritalStatus: string | null;
  nationality: string | null;
  preferredLanguage: string;
  timezone: string;
  emailVerified: boolean;
  mobileVerified: boolean;
  createdAt: string;
  activeCompany: {
    companyId: string;
    companyCode: string;
    legalName: string;
    displayName: string;
    logoUrl: string | null;
  } | null;
  companyMembership: {
    companyUserId: string;
    employeeCode: string;
    designation: string | null;
    department: string | null;
    joiningDate: string | null;
    employmentStatus: string;
    workLocation: string | null;
  } | null;
  roles: Array<{
    roleId: string;
    name: string;
    code: string;
  }>;
  currentSession: {
    sessionId: string;
    loginAt: string;
    lastActivityAt: string;
    deviceName: string | null;
    browser: string | null;
    operatingSystem: string | null;
  } | null;
}

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

@Injectable()
export class ProfileService {
  private readonly logger = new Logger(ProfileService.name);

  constructor(
    private readonly authRepository: AuthRepository,
    private readonly passwordService: PasswordService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async getProfile(
    userId: string,
    sessionId?: string,
    companyId?: string,
    companyUserId?: string,
  ): Promise<ProfileResponse> {
    this.logger.log(`Profile viewed for user ${userId}`);

    const user = await this.authRepository.findUserWithProfile(userId);

    if (!user) {
      throw new InvalidCredentialsException();
    }

    let activeCompanyData: ProfileResponse['activeCompany'] = null;
    let companyMembershipData: ProfileResponse['companyMembership'] = null;
    let rolesData: ProfileResponse['roles'] = [];

    if (companyUserId) {
      const companyUser = user.companyUsers.find((cu) => cu.id === companyUserId);

      if (companyUser) {
        activeCompanyData = {
          companyId: companyUser.company.id,
          companyCode: companyUser.company.companyCode,
          legalName: companyUser.company.legalName,
          displayName: companyUser.company.displayName || companyUser.company.legalName,
          logoUrl: companyUser.company.logoUrl,
        };

        companyMembershipData = {
          companyUserId: companyUser.id,
          employeeCode: companyUser.employeeCode,
          designation: companyUser.designation,
          department: companyUser.department,
          joiningDate: companyUser.joiningDate?.toISOString() ?? null,
          employmentStatus: companyUser.employmentStatus as string,
          workLocation: companyUser.workLocation,
        };

        rolesData = companyUser.userRoles.map((ur) => ({
          roleId: ur.role.id,
          name: ur.role.name,
          code: ur.role.code,
        }));
      }
    }

    let sessionData: ProfileResponse['currentSession'] = null;

    if (sessionId) {
      const session = await this.authRepository.findCurrentSession(sessionId);
      if (session) {
        sessionData = {
          sessionId: session.id,
          loginAt: session.loginAt.toISOString(),
          lastActivityAt: session.lastActivityAt.toISOString(),
          deviceName: session.deviceName,
          browser: session.browser,
          operatingSystem: session.operatingSystem,
        };
      }
    }

    return {
      id: user.id,
      firstName: user.firstName,
      middleName: user.middleName,
      lastName: user.lastName,
      displayName: user.displayName,
      username: user.username,
      email: user.email,
      mobileNumber: user.mobileNumber,
      alternateMobileNumber: user.alternateMobileNumber,
      profilePhotoUrl: user.profilePhotoUrl,
      gender: user.gender,
      dateOfBirth: user.dateOfBirth?.toISOString() ?? null,
      bloodGroup: user.bloodGroup,
      maritalStatus: user.maritalStatus,
      nationality: user.nationality,
      preferredLanguage: user.preferredLanguage,
      timezone: user.timezone,
      emailVerified: user.emailVerified,
      mobileVerified: user.mobileVerified,
      createdAt: user.createdAt.toISOString(),
      activeCompany: activeCompanyData,
      companyMembership: companyMembershipData,
      roles: rolesData,
      currentSession: sessionData,
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    this.logger.log(`Profile update for user ${userId}`);

    const updateData: Prisma.UserUpdateInput = {};

    if (dto.firstName !== undefined) updateData.firstName = dto.firstName;
    if (dto.middleName !== undefined) updateData.middleName = dto.middleName;
    if (dto.lastName !== undefined) updateData.lastName = dto.lastName;
    if (dto.displayName !== undefined) updateData.displayName = dto.displayName;
    if (dto.mobileNumber !== undefined) updateData.mobileNumber = dto.mobileNumber;
    if (dto.alternateMobileNumber !== undefined)
      updateData.alternateMobileNumber = dto.alternateMobileNumber;
    if (dto.gender !== undefined) updateData.gender = dto.gender as Gender;
    if (dto.dateOfBirth !== undefined) updateData.dateOfBirth = new Date(dto.dateOfBirth);
    if (dto.bloodGroup !== undefined) updateData.bloodGroup = dto.bloodGroup;
    if (dto.maritalStatus !== undefined)
      updateData.maritalStatus = dto.maritalStatus as MaritalStatus;
    if (dto.nationality !== undefined) updateData.nationality = dto.nationality;

    if (Object.keys(updateData).length === 0) {
      return { success: true, message: 'No fields to update' };
    }

    await this.authRepository.updateUser(userId, updateData);

    this.eventEmitter.emit(ProfileUpdatedEvent.eventName, new ProfileUpdatedEvent(userId));

    await this.authRepository.createActivityLog({
      user: { connect: { id: userId } },
      title: 'Profile Updated',
      activityType: 'PROFILE_UPDATE',
      module: 'AUTH',
      entityName: 'User',
      entityId: userId,
      performedAt: new Date(),
    });

    this.logger.log(`Profile updated for user ${userId}`);

    return { success: true, message: 'Profile updated successfully' };
  }

  async changePassword(userId: string, sessionId: string, dto: ChangePasswordDto) {
    this.logger.log(`Password change for user ${userId}`);

    const user = await this.authRepository.findUserWithProfile(userId);

    if (!user) {
      throw new InvalidCredentialsException();
    }

    const currentPasswordValid = await this.passwordService.verifyPassword(
      dto.currentPassword,
      user.passwordHash,
    );

    if (!currentPasswordValid) {
      throw new InvalidCredentialsException();
    }

    if (dto.newPassword !== dto.confirmPassword) {
      throw new PasswordMismatchException();
    }

    const passwordValidation = this.passwordService.validatePasswordStrength(dto.newPassword);
    if (!passwordValidation.isValid) {
      throw new WeakPasswordException(passwordValidation.errors);
    }

    const passwordHash = await this.passwordService.hashPassword(dto.newPassword);
    const newRefreshTokenVersion = user.refreshTokenVersion + 1;

    await this.authRepository.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          passwordHash,
          passwordChangedAt: new Date(),
          refreshTokenVersion: newRefreshTokenVersion,
        },
      });

      if (dto.logoutOtherDevices) {
        await tx.session.updateMany({
          where: {
            userId,
            id: { not: sessionId },
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
    });

    this.eventEmitter.emit(PasswordChangedEvent.eventName, new PasswordChangedEvent(userId));

    await this.authRepository.createActivityLog({
      user: { connect: { id: userId } },
      title: 'Password Changed',
      activityType: 'PASSWORD_CHANGE',
      module: 'AUTH',
      entityName: 'User',
      entityId: userId,
      performedAt: new Date(),
    });

    this.logger.log(`Password changed for user ${userId}`);

    return { success: true, message: 'Password changed successfully' };
  }

  async uploadProfilePhoto(userId: string, companyId: string, file: FileUpload) {
    this.logger.log(`Profile photo upload for user ${userId}`);

    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new InvalidFileException();
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new FileTooLargeException();
    }

    const extension = this.getExtension(file.mimetype);
    const storedFileName = `${randomUUID()}${extension}`;
    const uploadDir = join(cwd(), 'uploads', 'profiles');
    const storagePath = join(uploadDir, storedFileName);

    await mkdir(uploadDir, { recursive: true });
    await writeFile(storagePath, Buffer.from(file.buffer));

    const publicUrl = `/uploads/profiles/${storedFileName}`;

    const fileAttachment = await this.authRepository.createFileAttachment({
      company: { connect: { id: companyId } },
      uploadedByUser: { connect: { id: userId } },
      originalFileName: file.originalname,
      storedFileName,
      fileExtension: extension,
      mimeType: file.mimetype,
      fileCategory: 'USER_PROFILE',
      fileSize: file.size,
      storageProvider: 'LOCAL',
      bucketName: 'local',
      storagePath,
      publicUrl,
      entityType: 'User',
      entityId: userId,
      isPublic: true,
    });

    await this.authRepository.updateUser(userId, {
      profilePhotoUrl: publicUrl,
    });

    this.eventEmitter.emit(
      ProfilePhotoUploadedEvent.eventName,
      new ProfilePhotoUploadedEvent(userId, fileAttachment.id),
    );

    await this.authRepository.createActivityLog({
      user: { connect: { id: userId } },
      title: 'Profile Photo Uploaded',
      activityType: 'PROFILE_UPDATE',
      module: 'AUTH',
      entityName: 'User',
      entityId: userId,
      performedAt: new Date(),
    });

    this.logger.log(`Profile photo uploaded for user ${userId}`);

    return {
      success: true,
      message: 'Profile photo uploaded successfully',
      data: {
        fileId: fileAttachment.id,
        fileName: fileAttachment.originalFileName,
        fileUrl: publicUrl,
        fileSize: fileAttachment.fileSize,
        mimeType: fileAttachment.mimeType,
      },
    };
  }

  async updatePreferences(userId: string, dto: UpdatePreferencesDto) {
    this.logger.log(`Preferences update for user ${userId}`);

    const updateData: Prisma.UserUpdateInput = {};

    if (dto.preferredLanguage !== undefined) {
      updateData.preferredLanguage = dto.preferredLanguage as Language;
    }

    if (dto.timezone !== undefined) {
      updateData.timezone = dto.timezone as Timezone;
    }

    const user = await this.authRepository.findUserWithProfile(userId);
    const existingMetadata = (user?.metadata as Record<string, unknown> | null) ?? {};

    const metadataUpdate: Record<string, unknown> = { ...existingMetadata };

    if (dto.dateFormat !== undefined) metadataUpdate.dateFormat = dto.dateFormat;
    if (dto.timeFormat !== undefined) metadataUpdate.timeFormat = dto.timeFormat;
    if (dto.theme !== undefined) metadataUpdate.theme = dto.theme;

    if (Object.keys(metadataUpdate).length > 0) {
      updateData.metadata = metadataUpdate as Prisma.InputJsonValue;
    }

    await this.authRepository.updateUser(userId, updateData);

    this.eventEmitter.emit(PreferencesUpdatedEvent.eventName, new PreferencesUpdatedEvent(userId));

    await this.authRepository.createActivityLog({
      user: { connect: { id: userId } },
      title: 'Preferences Updated',
      activityType: 'SETTINGS_CHANGE',
      module: 'AUTH',
      entityName: 'User',
      entityId: userId,
      performedAt: new Date(),
    });

    this.logger.log(`Preferences updated for user ${userId}`);

    return { success: true, message: 'Preferences updated successfully' };
  }

  private getExtension(mimeType: string): string {
    switch (mimeType) {
      case 'image/jpeg':
        return '.jpg';
      case 'image/png':
        return '.png';
      case 'image/webp':
        return '.webp';
      default:
        return '.bin';
    }
  }
}
