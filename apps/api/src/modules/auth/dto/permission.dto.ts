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

export class CreatePermissionDto {
  @IsUUID('4')
  moduleId!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(200)
  name!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
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

  @IsEnum([
    'VIEW',
    'CREATE',
    'UPDATE',
    'DELETE',
    'APPROVE',
    'REJECT',
    'IMPORT',
    'EXPORT',
    'PRINT',
    'UPLOAD',
    'DOWNLOAD',
    'ASSIGN',
    'TRANSFER',
    'CANCEL',
    'RESTORE',
    'ARCHIVE',
  ] as const)
  action!:
    | 'VIEW'
    | 'CREATE'
    | 'UPDATE'
    | 'DELETE'
    | 'APPROVE'
    | 'REJECT'
    | 'IMPORT'
    | 'EXPORT'
    | 'PRINT'
    | 'UPLOAD'
    | 'DOWNLOAD'
    | 'ASSIGN'
    | 'TRANSFER'
    | 'CANCEL'
    | 'RESTORE'
    | 'ARCHIVE';

  @IsOptional()
  @IsEnum(['MENU', 'SCREEN', 'API', 'ACTION', 'FEATURE'] as const)
  permissionType?: 'MENU' | 'SCREEN' | 'API' | 'ACTION' | 'FEATURE';

  @IsOptional()
  @IsString()
  @MaxLength(100)
  resourceType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  apiEndpoint?: string;

  @IsOptional()
  @IsEnum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'] as const)
  httpMethod?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

  @IsOptional()
  @IsString()
  @MaxLength(500)
  frontendRoute?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  menuKey?: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  displayOrder?: number;
}

export class UpdatePermissionDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  displayName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  apiEndpoint?: string;

  @IsOptional()
  @IsEnum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'] as const)
  httpMethod?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

  @IsOptional()
  @IsString()
  @MaxLength(500)
  frontendRoute?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  menuKey?: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  displayOrder?: number;
}

export class PermissionStatusChangeDto {
  @IsEnum(['ACTIVE', 'INACTIVE', 'ARCHIVED'] as const)
  status!: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
}

export class PermissionQueryDto {
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
  @IsIn([
    'name',
    'code',
    'module',
    'action',
    'permissionType',
    'status',
    'createdAt',
    'updatedAt',
  ] as const)
  sortBy?: string;

  @IsOptional()
  @IsIn(['asc', 'desc'] as const)
  sortOrder?: 'asc' | 'desc';

  @IsOptional()
  @IsString()
  module?: string;

  @IsOptional()
  @IsString()
  subModule?: string;

  @IsOptional()
  @IsEnum([
    'VIEW',
    'CREATE',
    'UPDATE',
    'DELETE',
    'APPROVE',
    'REJECT',
    'IMPORT',
    'EXPORT',
    'PRINT',
    'UPLOAD',
    'DOWNLOAD',
    'ASSIGN',
    'TRANSFER',
    'CANCEL',
    'RESTORE',
    'ARCHIVE',
  ] as const)
  action?:
    | 'VIEW'
    | 'CREATE'
    | 'UPDATE'
    | 'DELETE'
    | 'APPROVE'
    | 'REJECT'
    | 'IMPORT'
    | 'EXPORT'
    | 'PRINT'
    | 'UPLOAD'
    | 'DOWNLOAD'
    | 'ASSIGN'
    | 'TRANSFER'
    | 'CANCEL'
    | 'RESTORE'
    | 'ARCHIVE';

  @IsOptional()
  @IsEnum(['MENU', 'SCREEN', 'API', 'ACTION', 'FEATURE'] as const)
  permissionType?: 'MENU' | 'SCREEN' | 'API' | 'ACTION' | 'FEATURE';

  @IsOptional()
  @IsEnum(['ACTIVE', 'INACTIVE'] as const)
  status?: 'ACTIVE' | 'INACTIVE';

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isSystemPermission?: boolean;
}
