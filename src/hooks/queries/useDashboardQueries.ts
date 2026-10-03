import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../../services/dashboardService.ts';
import type { DashboardFilterState } from '../../types/dashboard.ts';

export const dashboardQueryKeys = {
  all: ['dashboard'] as const,
  data: (filters: DashboardFilterState) => ['dashboard', 'data', filters] as const,
};

export function useDashboardDataQuery(
  filters: DashboardFilterState = { scope: 'ALL', location: 'ALL', timeRange: '30D' }
) {
  return useQuery({
    queryKey: dashboardQueryKeys.data(filters),
    queryFn: () => dashboardService.getDashboardData(filters),
  });
}
