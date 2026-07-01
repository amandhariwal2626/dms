import { IsArray, IsString, IsUUID, ArrayNotEmpty, ArrayUnique } from 'class-validator';

export class ReplacePermissionsDto {
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  permissionIds!: string[];
}

export class CopyPermissionsDto {
  @IsString()
  @IsUUID('4')
  sourceRoleId!: string;
}

export interface PermissionAssignmentData {
  id: string;
  name: string;
  code: string;
  displayName: string | null;
  description: string | null;
  action: string;
  permissionType: string;
  assigned: boolean;
  inherited: boolean;
  effect: string;
  scope: string | null;
  feature: string | null;
  screen: string | null;
}

export interface FeatureGroup {
  feature: string | null;
  permissions: PermissionAssignmentData[];
}

export interface ModulePermissionGroup {
  module: string;
  moduleId: string;
  features: FeatureGroup[];
}

export interface PermissionsByRoleResponse {
  success: true;
  data: {
    roleId: string;
    roleName: string;
    roleCode: string;
    permissions: ModulePermissionGroup[];
  };
}

export interface EffectivePermissionData {
  id: string;
  name: string;
  code: string;
  displayName: string | null;
  action: string;
  effect: string;
  scope: string | null;
  inherited: boolean;
  isSystemAssignment: boolean;
  module: string;
  feature: string | null;
  screen: string | null;
  permissionType: string;
}

export interface EffectivePermissionsResponse {
  success: true;
  data: {
    roleId: string;
    roleName: string;
    roleCode: string;
    permissions: EffectivePermissionData[];
  };
}

export interface PermissionActionResponse {
  success: true;
  message: string;
  data?: Record<string, unknown>;
}
