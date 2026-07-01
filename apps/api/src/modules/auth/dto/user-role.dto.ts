import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  ArrayNotEmpty,
  ArrayUnique,
  Min,
} from 'class-validator';

export class AssignRoleDto {
  @IsString()
  @IsUUID('4')
  roleId!: string;

  @IsOptional()
  @IsDateString()
  effectiveFrom?: string;

  @IsOptional()
  @IsDateString()
  effectiveTo?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  priority?: number;

  @IsOptional()
  @IsBoolean()
  isPrimaryRole?: boolean;

  @IsOptional()
  @IsString()
  assignmentReason?: string;
}

export class AssignRolesDto {
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  roleIds!: string[];

  @IsOptional()
  @IsDateString()
  effectiveFrom?: string;

  @IsOptional()
  @IsDateString()
  effectiveTo?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  priority?: number;

  @IsOptional()
  @IsString()
  isPrimaryRole?: boolean;

  @IsOptional()
  @IsString()
  assignmentReason?: string;
}

export class ReplaceRolesDto {
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  roleIds!: string[];

  @IsOptional()
  @IsString()
  assignmentReason?: string;
}

export class UpdateUserRoleStatusDto {
  @IsString()
  status!: 'ACTIVE' | 'INACTIVE';
}

export class UpdateUserRoleDto {
  @IsOptional()
  @IsBoolean()
  isPrimaryRole?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  priority?: number;

  @IsOptional()
  @IsDateString()
  effectiveFrom?: string;

  @IsOptional()
  @IsDateString()
  effectiveTo?: string;
}

export interface UserRoleResponseData {
  id: string;
  roleId: string;
  roleName: string;
  roleCode: string;
  roleDisplayName: string | null;
  isPrimary: boolean;
  priority: number;
  isActive: boolean;
  status: string;
  effectiveFrom: string | null;
  effectiveTo: string | null;
  assignedAt: string;
  assignedBy: string | null;
  assignmentReason: string | null;
}

export interface UserRolesListResponse {
  success: true;
  data: {
    companyUserId: string;
    userId: string;
    displayName?: string;
    email?: string | null;
    roles: UserRoleResponseData[];
  };
}

export interface UserRoleActionResponse {
  success: true;
  message: string;
  data?: {
    id: string;
    roleId: string;
    roleName: string;
    roleCode: string;
  };
}
