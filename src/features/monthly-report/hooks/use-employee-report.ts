'use client';

import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/shared/constants/query-keys';

import { getEmployeeReport } from '../services/report.service';

export function useEmployeeReport(employeeId: string, month: string, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.report.employee(employeeId, month),
    queryFn: () => getEmployeeReport(employeeId, month),
    enabled: enabled && !!employeeId && !!month,
  });
}
