import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AuthRepository } from '../repositories/auth.repository';
import { PasswordService } from './password.service';
import { HashService } from './hash.service';
import { generateOtp } from '../utils/otp.util';
import { addMinutes, isExpired } from '../utils/date.util';
import { normalizeEmail } from '../utils/auth.util';
import type {
  ForgotPasswordDto,
  ResendPasswordResetDto,
  VerifyPasswordResetDto,
  ResetPasswordDto,
} from '../dto/password-reset.dto';
import {
  PasswordResetRequestedEvent,
  PasswordResetVerifiedEvent,
  PasswordChangedEvent,
} from '../events/auth.events';
import {
  InvalidOtpException,
  OtpExpiredException,
  TooManyAttemptsException,
  TooManyResendsException,
  TokenUsedException,
  WeakPasswordException,
  PasswordMismatchException,
} from '../exceptions/auth.exceptions';

export interface PasswordResetResponse {
  success: true;
  message: string;
}

const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 10;
const MAX_ATTEMPTS = 5;
const MAX_RESENDS = 5;

@Injectable()
export class PasswordResetService {
  private readonly logger = new Logger(PasswordResetService.name);

  constructor(
    private readonly authRepository: AuthRepository,
    private readonly passwordService: PasswordService,
    private readonly hashService: HashService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async forgotPassword(dto: ForgotPasswordDto): Promise<PasswordResetResponse> {
    const email = normalizeEmail(dto.email);

    this.logger.log(`Forgot password started for ${email}`);

    const user = await this.authRepository.findUserByEmail(email);

    if (!user) {
      this.logger.log(`Forgot password: no user found for ${email} — returning generic success`);
      return {
        success: true,
        message: 'If an account with this email exists, a reset code has been sent',
      };
    }

    if (user.isDeleted || user.status !== 'ACTIVE' || !user.isActive || !user.emailVerified) {
      this.logger.log(
        `Forgot password: user ${user.id} is not eligible — returning generic success`,
      );
      return {
        success: true,
        message: 'If an account with this email exists, a reset code has been sent',
      };
    }

    await this.authRepository.invalidatePendingTokens(email, 'RESET_PASSWORD');

    const otp = generateOtp(OTP_LENGTH);
    const hashedOtp = this.hashService.hash(otp);
    const expiresAt = addMinutes(new Date(), OTP_EXPIRY_MINUTES);

    await this.authRepository.createVerificationToken({
      email,
      otp: hashedOtp,
      purpose: 'RESET_PASSWORD',
      tokenType: 'OTP',
      expiresAt,
      maxAttempts: MAX_ATTEMPTS,
      status: 'PENDING',
    });

    this.eventEmitter.emit(
      PasswordResetRequestedEvent.eventName,
      new PasswordResetRequestedEvent(user.id, email),
    );

    await this.authRepository.createActivityLog({
      user: { connect: { id: user.id } },
      title: 'Password Reset Requested',
      activityType: 'PASSWORD_CHANGE',
      module: 'AUTH',
      entityName: 'User',
      entityId: user.id,
      performedAt: new Date(),
    });

    this.logger.log(
      `Forgot password: OTP generated for ${email}, expires at ${expiresAt.toISOString()}`,
    );

    return {
      success: true,
      message: 'If an account with this email exists, a reset code has been sent',
    };
  }

  async resendPasswordReset(dto: ResendPasswordResetDto): Promise<PasswordResetResponse> {
    const email = normalizeEmail(dto.email);

    this.logger.log(`Resend password reset OTP for ${email}`);

    const existingToken = await this.authRepository.findPasswordResetToken(email);

    const currentResendCount = existingToken?.resendCount ?? 0;

    if (currentResendCount >= MAX_RESENDS) {
      throw new TooManyResendsException();
    }

    await this.authRepository.invalidatePendingTokens(email, 'RESET_PASSWORD');

    const otp = generateOtp(OTP_LENGTH);
    const hashedOtp = this.hashService.hash(otp);
    const expiresAt = addMinutes(new Date(), OTP_EXPIRY_MINUTES);

    await this.authRepository.createVerificationToken({
      email,
      otp: hashedOtp,
      purpose: 'RESET_PASSWORD',
      tokenType: 'OTP',
      expiresAt,
      maxAttempts: MAX_ATTEMPTS,
      resendCount: currentResendCount + 1,
      status: 'PENDING',
    });

    const user = await this.authRepository.findUserByEmail(email);

    if (user) {
      await this.authRepository.createActivityLog({
        user: { connect: { id: user.id } },
        title: 'Password Reset OTP Resent',
        activityType: 'PASSWORD_CHANGE',
        module: 'AUTH',
        entityName: 'User',
        entityId: user.id,
        performedAt: new Date(),
      });
    }

    this.logger.log(`Password reset OTP resent to ${email}`);

    return { success: true, message: 'A new reset code has been sent to your email' };
  }

  async verifyPasswordReset(dto: VerifyPasswordResetDto): Promise<PasswordResetResponse> {
    const email = normalizeEmail(dto.email);
    const otp = dto.otp.trim();

    this.logger.log(`Verify password reset OTP for ${email}`);

    if (!/^\d{6}$/.test(otp)) {
      throw new InvalidOtpException();
    }

    const tokenRecord = await this.authRepository.findPasswordResetToken(email);

    if (!tokenRecord) {
      throw new InvalidOtpException();
    }

    if (tokenRecord.status !== 'PENDING' || tokenRecord.isUsed) {
      throw new InvalidOtpException();
    }

    if (tokenRecord.attemptCount >= tokenRecord.maxAttempts) {
      throw new TooManyAttemptsException();
    }

    if (tokenRecord.expiresAt && isExpired(tokenRecord.expiresAt)) {
      await this.authRepository.updateVerificationToken(tokenRecord.id, { status: 'EXPIRED' });
      throw new OtpExpiredException();
    }

    if (!tokenRecord.otp) {
      throw new InvalidOtpException();
    }

    const isOtpValid = this.hashService.compare(otp, tokenRecord.otp);
    if (!isOtpValid) {
      const newAttemptCount = tokenRecord.attemptCount + 1;
      const updateData: Record<string, unknown> = {
        attemptCount: newAttemptCount,
        failureReason: 'Invalid OTP',
      };

      if (newAttemptCount >= tokenRecord.maxAttempts) {
        updateData.status = 'BLOCKED';
      }

      await this.authRepository.updateVerificationToken(tokenRecord.id, updateData);
      throw new InvalidOtpException();
    }

    await this.authRepository.updateVerificationToken(tokenRecord.id, {
      status: 'VERIFIED',
      verifiedAt: new Date(),
    });

    const user = await this.authRepository.findUserByEmail(email);

    if (user) {
      this.eventEmitter.emit(
        PasswordResetVerifiedEvent.eventName,
        new PasswordResetVerifiedEvent(user.id, email),
      );

      await this.authRepository.createActivityLog({
        user: { connect: { id: user.id } },
        title: 'Password Reset Verified',
        activityType: 'PASSWORD_CHANGE',
        module: 'AUTH',
        entityName: 'User',
        entityId: user.id,
        performedAt: new Date(),
      });
    }

    this.logger.log(`Password reset OTP verified for ${email}`);

    return { success: true, message: 'OTP verified successfully' };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<PasswordResetResponse> {
    const email = normalizeEmail(dto.email);

    this.logger.log(`Reset password for ${email}`);

    if (dto.newPassword !== dto.confirmPassword) {
      throw new PasswordMismatchException();
    }

    const passwordValidation = this.passwordService.validatePasswordStrength(dto.newPassword);
    if (!passwordValidation.isValid) {
      throw new WeakPasswordException(passwordValidation.errors);
    }

    const tokenRecord = await this.authRepository.findVerifiedPasswordResetToken(email);

    if (!tokenRecord) {
      throw new InvalidOtpException();
    }

    if (tokenRecord.expiresAt && isExpired(tokenRecord.expiresAt)) {
      throw new OtpExpiredException();
    }

    if (tokenRecord.isUsed) {
      throw new TokenUsedException();
    }

    const user = await this.authRepository.findUserByEmail(email);

    if (!user) {
      throw new InvalidOtpException();
    }

    const passwordHash = await this.passwordService.hashPassword(dto.newPassword);
    const newRefreshTokenVersion = user.refreshTokenVersion + 1;

    await this.authRepository.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: {
          passwordHash,
          passwordChangedAt: new Date(),
          passwordResetRequired: false,
          forcePasswordChange: false,
          refreshTokenVersion: newRefreshTokenVersion,
        },
      });

      await tx.emailVerificationToken.update({
        where: { id: tokenRecord.id },
        data: {
          isUsed: true,
          usedAt: new Date(),
        },
      });

      if (dto.logoutFromAllDevices) {
        await tx.session.updateMany({
          where: {
            userId: user.id,
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
    });

    this.eventEmitter.emit(PasswordChangedEvent.eventName, new PasswordChangedEvent(user.id));

    await this.authRepository.createActivityLog({
      user: { connect: { id: user.id } },
      title: 'Password Changed',
      activityType: 'PASSWORD_CHANGE',
      module: 'AUTH',
      entityName: 'User',
      entityId: user.id,
      performedAt: new Date(),
    });

    this.logger.log(`Password reset completed for user ${user.id}`);

    return { success: true, message: 'Password has been reset successfully' };
  }
}
