import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { queryKeys } from '@/shared/constants/query-keys';

import { addEmployee } from '../services/employee-management.service';
import { type AddEmployeeInput } from '../types/employee-management.type';

export function useAddEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AddEmployeeInput) =>
      addEmployee({
        name: data.name,
        email: data.email,
        slackId: data.slackId,
        role: data.role,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.all });
      toast.success('Thêm nhân viên thành công');
    },
    onError: (error: Error) => {
      toast.error(error.message ?? 'Thêm nhân viên thất bại');
    },
  });
}
