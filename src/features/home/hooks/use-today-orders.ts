'use client';

import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/shared/constants/query-keys';
import { getTodayVNDateString } from '@/shared/utils/format';

import { getTodayOrders } from '../services/order.service';

export function useTodayOrders(employeeId: string) {
  const date = getTodayVNDateString();
  return useQuery({
    queryKey: queryKeys.orders.byEmployee(employeeId, date),
    queryFn: () => getTodayOrders(employeeId, date),
    enabled: !!employeeId,
    refetchInterval: 30_000,
  });
}
