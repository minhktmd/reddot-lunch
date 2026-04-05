'use client';

import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/shared/constants/query-keys';
import { getEmployees } from '../services/employee.service';

export function useEmployees() {
  return useQuery({
    queryKey: queryKeys.employees.all,
    queryFn: getEmployees,
  });
}
