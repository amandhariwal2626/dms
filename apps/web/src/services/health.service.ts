import type { ApiResponse } from '@repo/shared-types';
import { apiClient } from '@/lib/api-client';

export interface HealthStatus {
  readonly status: 'ok';
  readonly uptime: number;
  readonly timestamp: string;
}

export async function getHealthStatus(): Promise<ApiResponse<HealthStatus>> {
  const response = await apiClient.get<HealthStatus>('/api/health');

  return {
    status: 'success',
    data: response.data,
  };
}
