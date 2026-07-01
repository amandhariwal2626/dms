import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  middleName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  displayName?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\+?[1-9]\d{1,14}$/, { message: 'Invalid mobile number format' })
  mobileNumber?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\+?[1-9]\d{1,14}$/, { message: 'Invalid alternate mobile number format' })
  alternateMobileNumber?: string;

  @IsOptional()
  @IsEnum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY'])
  gender?: string;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @IsOptional()
  @IsString()
  bloodGroup?: string;

  @IsOptional()
  @IsEnum(['SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED', 'SEPARATED', 'PREFER_NOT_TO_SAY'])
  maritalStatus?: string;

  @IsOptional()
  @IsString()
  nationality?: string;
}

export class ChangePasswordDto {
  @IsString()
  currentPassword!: string;

  @IsString()
  @MinLength(8)
  newPassword!: string;

  @IsString()
  @MinLength(8)
  confirmPassword!: string;

  @IsOptional()
  @IsBoolean()
  logoutOtherDevices?: boolean;
}

export class UpdatePreferencesDto {
  @IsOptional()
  @IsEnum(['EN', 'HI', 'GU', 'MR', 'TA', 'TE', 'KN', 'BN', 'ES', 'FR', 'AR'])
  preferredLanguage?: string;

  @IsOptional()
  @IsEnum([
    'UTC',
    'ASIA_KOLKATA',
    'ASIA_DUBAI',
    'ASIA_SINGAPORE',
    'AMERICA_NEW_YORK',
    'AMERICA_CHICAGO',
    'AMERICA_DENVER',
    'AMERICA_LOS_ANGELES',
    'EUROPE_LONDON',
    'EUROPE_BERLIN',
    'EUROPE_PARIS',
    'AUSTRALIA_SYDNEY',
  ])
  timezone?: string;

  @IsOptional()
  @IsString()
  dateFormat?: string;

  @IsOptional()
  @IsString()
  timeFormat?: string;

  @IsOptional()
  @IsString()
  theme?: string;
}
