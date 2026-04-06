'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { updateEmployee } from '@/domains/employee';
import { queryKeys } from '@/shared/constants/query-keys';

import type { EmployeeListItem } from '@/domains/employee';

export function useToggleAutoOrder(employeeId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (autoOrder: boolean) => updateEmployee(employeeId, { autoOrder }),
    onMutate: async (autoOrder: boolean) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.employees.all });
      const prev = queryClient.getQueryData<EmployeeListItem[]>(queryKeys.employees.all);
      queryClient.setQueryData<EmployeeListItem[]>(queryKeys.employees.all, (old) =>
        old?.map((e) => (e.id === employeeId ? { ...e, autoOrder } : e)) ?? []
      );
      return { prev };
    },
    onError: (_err, _vars, context) => {
      queryClient.setQueryData(queryKeys.employees.all, context?.prev);
      toast.error('Không thể cập nhật cài đặt. Vui lòng thử lại.');
    },
    onSuccess: (_data, autoOrder) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.all });
      toast.success(autoOrder ? 'Đã bật đặt tự động' : 'Đã tắt đặt tự động');
    },
  });
}
