import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/apiClient';

export function useSiteSettings() {
  return useQuery({
    queryKey: ['public-settings'],
    queryFn: () => apiClient.get('/api/public/settings'),
    staleTime: 60 * 1000,
  });
}
