import { Body, Controller, Post, Query } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { EmailVerificationService } from '../services/email-verification.service';
import {
  RegisterDto,
  LoginDto,
  SendVerificationDto,
  VerifyEmailDto,
} from '../dto/auth.dto';
import type { VerificationPurpose } from '@prisma/client';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly emailVerificationService: EmailVerificationService,
  ) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('send-verification')
  async sendVerification(
    @Body() dto: SendVerificationDto,
    @Query('purpose') purpose?: VerificationPurpose,
  ) {
    return this.emailVerificationService.sendVerificationOtp({
      email: dto.email,
      purpose: purpose ?? 'REGISTER',
    });
  }

  @Post('resend-verification')
  async resendVerification(
    @Body() dto: SendVerificationDto,
    @Query('purpose') purpose?: VerificationPurpose,
  ) {
    return this.emailVerificationService.resendVerificationOtp({
      email: dto.email,
      purpose: purpose ?? 'REGISTER',
    });
  }

  @Post('verify-email')
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.emailVerificationService.verifyOtp({
      email: dto.email,
      otp: dto.otp,
      purpose: 'REGISTER',
    });
  }
}
