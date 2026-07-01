import {
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateRoleDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @Matches(/^[a-zA-Z0-9\s\-_()]+$/, {
    message:
      'Name can only contain letters, numbers, spaces, hyphens, underscores, and parentheses',
  })
  name!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(50)
  @Matches(/^[A-Z0-9_]+$/, { message: 'Code must be uppercase alphanumeric with underscores' })
  code!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  displayName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsUUID('4')
  parentRoleId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  defaultLandingPage?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  defaultModule?: string;
}

export class UpdateRoleDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  displayName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsUUID('4')
  parentRoleId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  defaultLandingPage?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  defaultModule?: string;
}

export class StatusChangeDto {
  @IsEnum(['ACTIVE', 'INACTIVE', 'ARCHIVED'] as const)
  status!: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
}

export class RoleQueryDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  limit?: number;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(['name', 'code', 'createdAt', 'updatedAt', 'hierarchyLevel', 'priority'] as const)
  sortBy?: string;

  @IsOptional()
  @IsIn(['asc', 'desc'] as const)
  sortOrder?: 'asc' | 'desc';

  @IsOptional()
  @IsEnum(['ACTIVE', 'INACTIVE', 'ARCHIVED'] as const)
  status?: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';

  @IsOptional()
  @IsEnum(['SYSTEM', 'DEFAULT', 'CUSTOM'] as const)
  roleType?: 'SYSTEM' | 'DEFAULT' | 'CUSTOM';

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isSystemRole?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isActive?: boolean;
}
