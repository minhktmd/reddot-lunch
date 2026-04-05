'use client';

import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/shared/constants/query-keys';
import { getTodayAdminOrders } from '../services/dashboard.service';

export function useTodayOrders() {
  return useQuery({
    queryKey: queryKeys.orders.today,
    queryFn: getTodayAdminOrders,
    refetchInterval: 30_000,
  });
}
