import { Body, Controller, Post } from '@nestjs/common';
import { PasswordResetService } from '../services/password-reset.service';
import {
  ForgotPasswordDto,
  ResendPasswordResetDto,
  VerifyPasswordResetDto,
  ResetPasswordDto,
} from '../dto/password-reset.dto';

@Controller('auth')
export class PasswordResetController {
  constructor(private readonly passwordResetService: PasswordResetService) {}

  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.passwordResetService.forgotPassword(dto);
  }

  @Post('resend-password-reset')
  async resendPasswordReset(@Body() dto: ResendPasswordResetDto) {
    return this.passwordResetService.resendPasswordReset(dto);
  }

  @Post('verify-password-reset')
  async verifyPasswordReset(@Body() dto: VerifyPasswordResetDto) {
    return this.passwordResetService.verifyPasswordReset(dto);
  }

  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.passwordResetService.resetPassword(dto);
  }
}
