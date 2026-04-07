import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { queryKeys } from '@/shared/constants/query-keys';

import { lockMenu } from '../services/menu-management.service';

export function useLockMenu() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (menuId: string) => lockMenu(menuId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.menu.today });
      toast.success('Đã chốt sổ');
    },
    onError: (error: Error) => {
      toast.error(error.message ?? 'Chốt sổ thất bại');
    },
  });
}
