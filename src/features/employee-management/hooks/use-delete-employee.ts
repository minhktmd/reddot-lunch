import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { queryKeys } from '@/shared/constants/query-keys';

import { deleteEmployee } from '../services/employee-management.service';

export function useDeleteEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: { id: string; name: string }) => deleteEmployee(id),
    onSuccess: (_, { name }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.all });
      toast.success(`Đã xóa nhân viên ${name}`);
    },
    onError: (error: Error) => {
      toast.error(error.message ?? 'Xóa nhân viên thất bại');
    },
  });
}
