import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import type { DeviceInfo } from '../types/auth.types';
import { AuthRepository } from '../repositories/auth.repository';
import { HashService } from './hash.service';
import { generateOtp } from '../utils/otp.util';
import { addMinutes, isExpired } from '../utils/date.util';
import { normalizeEmail } from '../utils/auth.util';
import { isValidOtp } from '../validators/otp.validator';
import { EmailVerifiedEvent } from '../events/auth.events';
import {
  InvalidOtpException,
  OtpExpiredException,
  TooManyAttemptsException,
} from '../exceptions/auth.exceptions';
import type { VerificationPurpose } from '@prisma/client';

export interface SendVerificationOtpParams {
  email: string;
  purpose: VerificationPurpose;
  deviceInfo?: DeviceInfo;
}

export interface VerifyOtpParams {
  email: string;
  otp: string;
  purpose: VerificationPurpose;
}

export interface VerificationResponse {
  success: true;
  message: string;
}

const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 15;

@Injectable()
export class EmailVerificationService {
  private readonly logger = new Logger(EmailVerificationService.name);

  constructor(
    private readonly authRepository: AuthRepository,
    private readonly hashService: HashService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async sendVerificationOtp(params: SendVerificationOtpParams): Promise<VerificationResponse> {
    const { purpose, deviceInfo } = params;
    const email = normalizeEmail(params.email);

    this.logger.log(`Sending verification OTP for ${email} (purpose: ${purpose})`);

    await this.authRepository.invalidatePendingTokens(email, purpose);

    const otp = generateOtp(OTP_LENGTH);
    const hashedOtp = this.hashService.hash(otp);
    const expiresAt = addMinutes(new Date(), OTP_EXPIRY_MINUTES);

    await this.authRepository.createVerificationToken({
      email,
      otp: hashedOtp,
      purpose,
      tokenType: 'OTP',
      expiresAt,
      maxAttempts: 5,
      status: 'PENDING',
      ipAddress: deviceInfo?.ipAddress ?? null,
      userAgent: deviceInfo?.userAgent ?? null,
      deviceId: deviceInfo?.deviceId ?? null,
      browser: deviceInfo?.browser ?? null,
      platform: deviceInfo?.platform ?? null,
    });

    this.logger.log(`Verification OTP sent to ${email} (expires at ${expiresAt.toISOString()})`);

    return { success: true, message: 'Verification code sent to your email' };
  }

  async resendVerificationOtp(params: SendVerificationOtpParams): Promise<VerificationResponse> {
    const { purpose, deviceInfo } = params;
    const email = normalizeEmail(params.email);

    this.logger.log(`Resending verification OTP for ${email} (purpose: ${purpose})`);

    const existingToken = await this.authRepository.findPendingVerification(email, purpose);

    if (existingToken && existingToken.resendCount >= 3) {
      throw new TooManyAttemptsException('Maximum resend limit reached. Please try again later');
    }

    await this.authRepository.invalidatePendingTokens(email, purpose);

    const otp = generateOtp(OTP_LENGTH);
    const hashedOtp = this.hashService.hash(otp);
    const expiresAt = addMinutes(new Date(), OTP_EXPIRY_MINUTES);

    await this.authRepository.createVerificationToken({
      email,
      otp: hashedOtp,
      purpose,
      tokenType: 'OTP',
      expiresAt,
      maxAttempts: 5,
      resendCount: (existingToken?.resendCount ?? 0) + 1,
      status: 'PENDING',
      ipAddress: deviceInfo?.ipAddress ?? null,
      userAgent: deviceInfo?.userAgent ?? null,
      deviceId: deviceInfo?.deviceId ?? null,
      browser: deviceInfo?.browser ?? null,
      platform: deviceInfo?.platform ?? null,
    });

    this.logger.log(`Verification OTP resent to ${email}`);

    return { success: true, message: 'New verification code sent to your email' };
  }

  async verifyOtp(params: VerifyOtpParams): Promise<VerificationResponse> {
    const { purpose } = params;
    const email = normalizeEmail(params.email);
    const otp = params.otp.trim();

    this.logger.log(`Verifying OTP for ${email} (purpose: ${purpose})`);

    if (!isValidOtp(otp)) {
      throw new InvalidOtpException();
    }

    const tokenRecord = await this.authRepository.findPendingVerification(email, purpose);

    if (!tokenRecord) {
      throw new InvalidOtpException();
    }

    if (this.isOtpBlocked(tokenRecord)) {
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
      isUsed: true,
      usedAt: new Date(),
    });

    this.logger.log(`Email verified for ${email}`);

    this.eventEmitter.emit(
      EmailVerifiedEvent.eventName,
      new EmailVerifiedEvent(tokenRecord.id, email),
    );

    return { success: true, message: 'Email verified successfully' };
  }

  private isOtpBlocked(token: {
    status: string;
    attemptCount: number;
    maxAttempts: number;
  }): boolean {
    if (token.status === 'BLOCKED') return true;
    return token.attemptCount >= token.maxAttempts;
  }
}
