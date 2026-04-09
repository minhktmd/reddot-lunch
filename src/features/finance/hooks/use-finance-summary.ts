'use client';

import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/shared/constants/query-keys';

import { getFinanceSummary } from '../services/finance.service';

export function useFinanceSummary() {
  return useQuery({
    queryKey: queryKeys.finance.summary(),
    queryFn: getFinanceSummary,
  });
}
