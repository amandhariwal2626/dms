import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import { AuthService } from '../services/auth.service';
import { EmailVerificationService } from '../services/email-verification.service';
import {
  RegisterDto,
  LoginDto,
  SendVerificationDto,
  VerifyEmailDto,
  SwitchCompanyDto,
  RefreshTokenDto,
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

  @Post('refresh')
  async refresh(
    @Body() dto: RefreshTokenDto,
    @Req() req: Request,
  ) {
    const tokenFromCookie = req.cookies?.['refresh_token'] as string | undefined;
    const tokenValue = dto.refreshToken || tokenFromCookie || '';
    return this.authService.refresh(tokenValue);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('companies')
  async getCompanies(@Req() req: Request) {
    const user = req.user as { id: string; sessionId?: string; companyId?: string };
    return this.authService.getUserCompanies(user.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('company/select')
  async selectCompany(@Req() req: Request, @Body() dto: SwitchCompanyDto) {
    const user = req.user as { id: string; sessionId?: string; companyId?: string };
    return this.authService.selectCompany(user.id, dto.companyId, user.sessionId ?? '');
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('company/switch')
  async switchCompany(@Req() req: Request, @Body() dto: SwitchCompanyDto) {
    const user = req.user as { id: string; sessionId?: string; companyId?: string };
    return this.authService.switchCompany(
      user.id,
      dto.companyId,
      user.sessionId ?? '',
      user.companyId ?? '',
    );
  }
}
