import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @IsString()
  companyName!: string;

  @IsString()
  displayName!: string;

  @IsEnum([
    'SOLE_PROPRIETORSHIP',
    'PARTNERSHIP',
    'LIMITED_LIABILITY_PARTNERSHIP',
    'PRIVATE_LIMITED',
    'PUBLIC_LIMITED',
    'ONE_PERSON_COMPANY',
    'NON_PROFIT',
    'GOVERNMENT_UNDERTAKING',
    'OTHER',
  ])
  businessType!: string;

  @IsString()
  firstName!: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsEmail()
  email!: string;

  @IsString()
  @Matches(/^\+?[1-9]\d{1,14}$/, { message: 'Invalid mobile number format' })
  mobileNumber!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsString()
  @MinLength(8)
  confirmPassword!: string;

  @IsBoolean()
  acceptTerms!: boolean;
}

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  password!: string;

  @IsOptional()
  @IsString()
  deviceId?: string;

  @IsOptional()
  @IsString()
  deviceName?: string;
}

export class RefreshTokenDto {
  @IsString()
  refreshToken!: string;
}

export class SendVerificationDto {
  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  deviceId?: string;
}

export class VerifyEmailDto {
  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  otp!: string;
}

export class ForgotPasswordDto {
  @IsEmail()
  email!: string;
}

export class ResetPasswordDto {
  @IsString()
  token!: string;

  @IsString()
  @MinLength(8)
  newPassword!: string;
}

export class SwitchCompanyDto {
  @IsString()
  companyId!: string;
}
