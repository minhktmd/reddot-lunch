'use client';

import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/shared/constants/query-keys';
import { getUnpaidOrders } from '../services/order.service';

export function useUnpaidOrders(employeeId: string) {
  return useQuery({
    queryKey: queryKeys.orders.unpaid(employeeId),
    queryFn: () => getUnpaidOrders(employeeId),
    enabled: !!employeeId,
  });
}
