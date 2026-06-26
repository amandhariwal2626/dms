import { useQuery } from '@tanstack/react-query';
import { getHealthStatus } from '@/services/health.service';

export function useHealth() {
  return useQuery({
    queryKey: ['health'],
    queryFn: getHealthStatus,
  });
}
