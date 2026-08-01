import { useQuery } from '@tanstack/react-query';
import { api } from '@/services';
import { queryKeys } from '@/constants/query-keys';

export function useDashboardOverview() {
  return useQuery({
    queryKey: queryKeys.dashboard.overview(),
    queryFn: () => api.dashboard.getOverview(),
  });
}

export function useRecentEvents(limit = 5) {
  return useQuery({
    queryKey: [...queryKeys.events.recent(), limit],
    queryFn: () => api.events.listRecent(limit),
  });
}

export function useRecentUsers(limit = 5) {
  return useQuery({
    queryKey: [...queryKeys.users.all, 'recent', limit],
    queryFn: async () => {
      const result = await api.users.list({
        page: 1,
        pageSize: limit,
        sort: { field: 'createdAt', direction: 'desc' },
      });
      return result.items;
    },
  });
}
