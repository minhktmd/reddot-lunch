import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { queryKeys } from '@/shared/constants/query-keys';

import { editEmployee } from '../services/employee-management.service';
import { type EditEmployeeInput } from '../types/employee-management.type';

type EditEmployeeParams = EditEmployeeInput & { id: string };

export function useEditEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...data }: EditEmployeeParams) =>
      editEmployee(id, {
        name: data.name,
        email: data.email,
        slackId: data.slackId,
        role: data.role,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.all });
      toast.success('Cập nhật nhân viên thành công');
    },
    onError: (error: Error) => {
      toast.error(error.message ?? 'Cập nhật nhân viên thất bại');
    },
  });
}

type ToggleActiveParams = { id: string; isActive: boolean };

export function useToggleEmployeeActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isActive }: ToggleActiveParams) => editEmployee(id, { isActive }),
    onSuccess: (_, { isActive }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.all });
      toast.success(isActive ? 'Đã kích hoạt nhân viên' : 'Đã vô hiệu hóa nhân viên');
    },
    onError: (error: Error) => {
      toast.error(error.message ?? 'Cập nhật trạng thái thất bại');
    },
  });
}
