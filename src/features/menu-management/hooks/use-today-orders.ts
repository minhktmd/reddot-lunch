import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/shared/constants/query-keys';

import { getTodayOrders } from '../services/menu-management.service';

export function useTodayOrders() {
  return useQuery({
    queryKey: queryKeys.orders.today,
    queryFn: getTodayOrders,
    refetchInterval: 30_000,
  });
}
