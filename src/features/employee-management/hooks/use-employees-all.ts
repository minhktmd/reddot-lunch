import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/shared/constants/query-keys';

import { getAllEmployees } from '../services/employee-management.service';

export function useEmployeesAll() {
  return useQuery({
    queryKey: queryKeys.employees.all,
    queryFn: getAllEmployees,
  });
}
