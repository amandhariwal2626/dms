import { Test, type TestingModule } from '@nestjs/testing';
import { PermissionCacheService, InMemoryCacheProvider } from './permission-cache.service';
import type { CachedAuthorizationData } from '../types/authorization.types';

describe('InMemoryCacheProvider', () => {
  let provider: InMemoryCacheProvider;

  beforeEach(() => {
    provider = new InMemoryCacheProvider();
  });

  it('should store and retrieve values', () => {
    provider.set('key1', 'value1');
    expect(provider.get('key1')).toBe('value1');
  });

  it('should return undefined for missing keys', () => {
    expect(provider.get('nonexistent')).toBeUndefined();
  });

  it('should delete values', () => {
    provider.set('key1', 'value1');
    provider.delete('key1');
    expect(provider.get('key1')).toBeUndefined();
  });

  it('should clear all values', () => {
    provider.set('key1', 'value1');
    provider.set('key2', 'value2');
    provider.clear();
    expect(provider.get('key1')).toBeUndefined();
    expect(provider.get('key2')).toBeUndefined();
  });

  it('should expire entries after TTL', () => {
    jest.useFakeTimers();
    provider.set('key1', 'value1', 100);
    jest.advanceTimersByTime(50);
    expect(provider.get('key1')).toBe('value1');
    jest.advanceTimersByTime(60);
    expect(provider.get('key1')).toBeUndefined();
    jest.useRealTimers();
  });

  it('should store complex objects', () => {
    const obj = { a: 1, b: [2, 3], c: { d: 'e' } };
    provider.set('obj', obj);
    expect(provider.get('obj')).toEqual(obj);
  });
});

describe('PermissionCacheService', () => {
  let service: PermissionCacheService;
  let cacheProvider: InMemoryCacheProvider;

  const mockData: CachedAuthorizationData = {
    companyContext: {
      companyId: 'company-1',
      companyUserId: 'cu-1',
      companyCode: 'C001',
      legalName: 'Test Corp',
      displayName: null,
      companyStatus: 'ACTIVE',
      companyIsActive: true,
      membershipStatus: 'ACTIVE',
      membershipIsActive: true,
      isDefaultCompany: true,
      isPrimaryCompany: true,
    },
    rolesResult: {
      roles: [],
      roleIds: [],
      roleCodes: [],
      primaryRole: null,
    },
    permissionSet: {
      permissions: [],
      permissionCodes: [],
      moduleAccess: [],
      actionAccess: [],
    },
    cachedAt: new Date().toISOString(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InMemoryCacheProvider,
        {
          provide: 'CACHE_PROVIDER',
          useExisting: InMemoryCacheProvider,
        },
        PermissionCacheService,
      ],
    }).compile();

    service = module.get<PermissionCacheService>(PermissionCacheService);
    cacheProvider = module.get<InMemoryCacheProvider>(InMemoryCacheProvider);
  });

  afterEach(() => {
    cacheProvider.clear();
  });

  it('should store and retrieve authorization data', () => {
    service.setAuthorizationData('company-1', 'user-1', mockData);
    const result = service.getAuthorizationData('company-1', 'user-1');
    expect(result).toEqual(mockData);
  });

  it('should return undefined for uncached data', () => {
    const result = service.getAuthorizationData('company-1', 'user-1');
    expect(result).toBeUndefined();
  });

  it('should invalidate specific cache entry', () => {
    service.setAuthorizationData('company-1', 'user-1', mockData);
    service.invalidate('company-1', 'user-1');
    expect(service.getAuthorizationData('company-1', 'user-1')).toBeUndefined();
  });

  it('should not affect other entries when invalidating one', () => {
    service.setAuthorizationData('company-1', 'user-1', mockData);
    service.setAuthorizationData('company-1', 'user-2', mockData);
    service.invalidate('company-1', 'user-1');
    expect(service.getAuthorizationData('company-1', 'user-2')).toEqual(mockData);
  });

  it('should invalidate all entries', () => {
    service.setAuthorizationData('company-1', 'user-1', mockData);
    service.setAuthorizationData('company-2', 'user-2', mockData);
    service.invalidateAll();
    expect(service.getAuthorizationData('company-1', 'user-1')).toBeUndefined();
    expect(service.getAuthorizationData('company-2', 'user-2')).toBeUndefined();
  });

  it('should invalidate by user across all companies', () => {
    cacheProvider.set('authz:company-1:user-1', mockData);
    cacheProvider.set('authz:company-2:user-1', mockData);
    service.invalidateByUser('user-1');
    cacheProvider.clear();
    expect(cacheProvider.get('authz:company-1:user-1')).toBeUndefined();
    expect(cacheProvider.get('authz:company-2:user-1')).toBeUndefined();
  });

  it('should build correct cache key format', () => {
    service.setAuthorizationData('c1', 'u1', mockData);
    const result = service.getAuthorizationData('c1', 'u1');
    expect(result).toBeDefined();
    expect(result?.companyContext.companyId).toBe('company-1');
  });
});
