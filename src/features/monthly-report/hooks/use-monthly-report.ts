'use client';

import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/shared/constants/query-keys';

import { getMonthlyReport } from '../services/report.service';

export function useMonthlyReport(month: string) {
  return useQuery({
    queryKey: queryKeys.report.monthly(month),
    queryFn: () => getMonthlyReport(month),
    enabled: !!month,
  });
}
