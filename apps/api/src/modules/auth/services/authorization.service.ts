import { Injectable, Logger } from '@nestjs/common';
import { CompanyContextResolver } from './company-context-resolver.service';
import { RoleResolver } from './role-resolver.service';
import { PermissionResolver } from './permission-resolver.service';
import { PermissionCacheService } from './permission-cache.service';
import type {
  AuthorizationCompanyContext,
  ResolvedRole,
  ResolvedPermission,
  EffectivePermissionSet,
  CachedAuthorizationData,
} from '../types/authorization.types';

@Injectable()
export class AuthorizationService {
  private readonly logger = new Logger(AuthorizationService.name);

  constructor(
    private readonly companyContextResolver: CompanyContextResolver,
    private readonly roleResolver: RoleResolver,
    private readonly permissionResolver: PermissionResolver,
    private readonly permissionCacheService: PermissionCacheService,
  ) {}

  async hasPermission(userId: string, companyId: string, permissionCode: string): Promise<boolean> {
    const permissionSet = await this.getOrResolvePermissionSet(userId, companyId);
    return permissionSet.permissionCodes.includes(permissionCode);
  }

  async hasAnyPermission(
    userId: string,
    companyId: string,
    permissionCodes: string[],
  ): Promise<boolean> {
    const permissionSet = await this.getOrResolvePermissionSet(userId, companyId);
    return permissionCodes.some((code) => permissionSet.permissionCodes.includes(code));
  }

  async hasAllPermissions(
    userId: string,
    companyId: string,
    permissionCodes: string[],
  ): Promise<boolean> {
    const permissionSet = await this.getOrResolvePermissionSet(userId, companyId);
    return permissionCodes.every((code) => permissionSet.permissionCodes.includes(code));
  }

  async hasModuleAccess(userId: string, companyId: string, module: string): Promise<boolean> {
    const permissionSet = await this.getOrResolvePermissionSet(userId, companyId);
    return permissionSet.moduleAccess.includes(module);
  }

  async hasActionAccess(userId: string, companyId: string, action: string): Promise<boolean> {
    const permissionSet = await this.getOrResolvePermissionSet(userId, companyId);
    return permissionSet.actionAccess.includes(action);
  }

  async hasRole(userId: string, companyId: string, roleCode: string): Promise<boolean> {
    const data = await this.getOrResolveAll(userId, companyId);
    return data.rolesResult.roleCodes.includes(roleCode);
  }

  async getEffectivePermissions(userId: string, companyId: string): Promise<ResolvedPermission[]> {
    const permissionSet = await this.getOrResolvePermissionSet(userId, companyId);
    return permissionSet.permissions;
  }

  async getEffectiveRoles(userId: string, companyId: string): Promise<ResolvedRole[]> {
    const data = await this.getOrResolveAll(userId, companyId);
    return data.rolesResult.roles;
  }

  async getCurrentCompanyContext(
    userId: string,
    companyId: string,
  ): Promise<AuthorizationCompanyContext> {
    const data = await this.getOrResolveAll(userId, companyId);
    return data.companyContext;
  }

  async refreshPermissionCache(userId: string, companyId: string): Promise<void> {
    const data = await this.resolveAll(userId, companyId);
    this.permissionCacheService.setAuthorizationData(companyId, userId, data);
  }

  invalidatePermissionCache(userId: string, companyId: string): void {
    this.permissionCacheService.invalidate(companyId, userId);
  }

  invalidateAllCaches(): void {
    this.permissionCacheService.invalidateAll();
  }

  onRoleChanged(): void {
    this.permissionCacheService.invalidateAll();
  }

  onUserRoleChanged(userId: string, companyId: string): void {
    this.permissionCacheService.invalidate(companyId, userId);
  }

  onCompanySwitched(userId: string, previousCompanyId: string): void {
    this.permissionCacheService.invalidate(previousCompanyId, userId);
  }

  onLogout(): void {
    this.permissionCacheService.invalidateByUser();
  }

  private async getOrResolvePermissionSet(
    userId: string,
    companyId: string,
  ): Promise<EffectivePermissionSet> {
    const data = await this.getOrResolveAll(userId, companyId);
    return data.permissionSet;
  }

  private async getOrResolveAll(
    userId: string,
    companyId: string,
  ): Promise<CachedAuthorizationData> {
    const cached = this.permissionCacheService.getAuthorizationData(companyId, userId);
    if (cached) {
      return cached;
    }

    const resolved = await this.resolveAll(userId, companyId);
    this.permissionCacheService.setAuthorizationData(companyId, userId, resolved);
    return resolved;
  }

  private async resolveAll(userId: string, companyId: string): Promise<CachedAuthorizationData> {
    const companyContext = await this.companyContextResolver.resolve(companyId, userId);
    const rolesResult = await this.roleResolver.resolve(companyContext.companyUserId);
    const permissionSet = await this.permissionResolver.resolve(rolesResult.roleIds);

    return {
      companyContext,
      rolesResult,
      permissionSet,
      cachedAt: new Date().toISOString(),
    };
  }
}
