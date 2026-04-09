'use client';

import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/shared/constants/query-keys';

import { getFundLedger } from '../services/finance.service';

export function useFundLedger(month: string) {
  return useQuery({
    queryKey: queryKeys.finance.fundLedger(month),
    queryFn: () => getFundLedger(month),
    enabled: !!month,
  });
}
