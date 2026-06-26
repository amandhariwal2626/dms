import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { UserRegisteredEvent, EmailVerifiedEvent } from '../events/auth.events';
import { EmailVerificationService } from '../services/email-verification.service';

@Injectable()
export class AuthListener {
  private readonly logger = new Logger(AuthListener.name);

  constructor(private readonly emailVerificationService: EmailVerificationService) {}

  @OnEvent(UserRegisteredEvent.eventName)
  async handleUserRegistered(event: UserRegisteredEvent): Promise<void> {
    this.logger.log(`Handling user registered event for ${event.email}`);

    try {
      await this.emailVerificationService.sendVerificationOtp({
        email: event.email,
        purpose: 'REGISTER',
      });
    } catch (error) {
      this.logger.error(
        `Failed to send verification OTP for ${event.email}`,
        error instanceof Error ? error.message : 'Unknown error',
      );
    }
  }

  @OnEvent(EmailVerifiedEvent.eventName)
  handleEmailVerified(event: EmailVerifiedEvent): void {
    this.logger.log(`Email verified for ${event.email}`);
  }
}
