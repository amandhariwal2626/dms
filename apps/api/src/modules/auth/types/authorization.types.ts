export interface AuthorizationCompanyContext {
  companyId: string;
  companyUserId: string;
  companyCode: string;
  legalName: string;
  displayName: string | null;
  companyStatus: string;
  companyIsActive: boolean;
  membershipStatus: string;
  membershipIsActive: boolean;
  isDefaultCompany: boolean;
  isPrimaryCompany: boolean;
}

export interface ResolvedRole {
  roleId: string;
  name: string;
  code: string;
  displayName: string | null;
  description: string | null;
  roleType: string;
  hierarchyLevel: number;
  priority: number;
  parentRoleId: string | null;
  isPrimary: boolean;
  isSystemRole: boolean;
  isUserRoleActive: boolean;
}

export interface RolesResult {
  roles: ResolvedRole[];
  roleIds: string[];
  roleCodes: string[];
  primaryRole: ResolvedRole | null;
}

export interface ResolvedPermission {
  permissionId: string;
  name: string;
  code: string;
  displayName: string | null;
  action: string;
  effect: string;
  scope: string;
  module: string;
  feature: string | null;
  screen: string | null;
  permissionType: string;
  isInherited: boolean;
  isSystemAssignment: boolean;
  roleId: string;
}

export interface EffectivePermissionSet {
  permissions: ResolvedPermission[];
  permissionCodes: string[];
  moduleAccess: string[];
  actionAccess: string[];
}

export interface CachedAuthorizationData {
  companyContext: AuthorizationCompanyContext;
  rolesResult: RolesResult;
  permissionSet: EffectivePermissionSet;
  cachedAt: string;
}

export interface ICacheProvider {
  get(key: string): unknown;
  set(key: string, value: unknown, ttlMs?: number): void;
  delete(key: string): void;
  clear(): void;
}
