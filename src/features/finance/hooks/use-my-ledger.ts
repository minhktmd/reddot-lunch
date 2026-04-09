'use client';

import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/shared/constants/query-keys';

import { getLedger } from '../services/finance.service';

export function useMyLedger(employeeId: string) {
  return useQuery({
    queryKey: queryKeys.finance.ledger(employeeId),
    queryFn: () => getLedger(employeeId),
    enabled: !!employeeId,
  });
}
