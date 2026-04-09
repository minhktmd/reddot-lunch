'use client';

import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/shared/constants/query-keys';

import { getBalance } from '../services/finance.service';

export function useMyBalance(employeeId: string) {
  return useQuery({
    queryKey: queryKeys.finance.balance(employeeId),
    queryFn: () => getBalance(employeeId),
    enabled: !!employeeId,
  });
}
