import { Inject, Injectable } from '@nestjs/common';
import type { ICacheProvider, CachedAuthorizationData } from '../types/authorization.types';

const CACHE_PREFIX = 'authz';
const DEFAULT_TTL_MS = 5 * 60 * 1000;

@Injectable()
export class InMemoryCacheProvider implements ICacheProvider {
  private readonly store = new Map<string, { data: unknown; expiresAt: number }>();

  get(key: string): unknown {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return entry.data;
  }

  set(key: string, value: unknown, ttlMs = DEFAULT_TTL_MS): void {
    this.store.set(key, { data: value, expiresAt: Date.now() + ttlMs });
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}

@Injectable()
export class PermissionCacheService {
  constructor(@Inject('CACHE_PROVIDER') private readonly cacheProvider: ICacheProvider) {}

  getAuthorizationData(companyId: string, userId: string): CachedAuthorizationData | undefined {
    return this.cacheProvider.get(this.buildKey(companyId, userId)) as
      | CachedAuthorizationData
      | undefined;
  }

  setAuthorizationData(companyId: string, userId: string, data: CachedAuthorizationData): void {
    this.cacheProvider.set(this.buildKey(companyId, userId), data, DEFAULT_TTL_MS);
  }

  invalidate(companyId: string, userId: string): void {
    this.cacheProvider.delete(this.buildKey(companyId, userId));
  }

  invalidateByUser(): void {
    this.cacheProvider.clear();
  }

  invalidateAll(): void {
    this.cacheProvider.clear();
  }

  private buildKey(companyId: string, userId: string): string {
    return `${CACHE_PREFIX}:${companyId}:${userId}`;
  }
}
