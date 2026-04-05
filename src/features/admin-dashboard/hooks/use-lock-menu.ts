'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { queryKeys } from '@/shared/constants/query-keys';
import { lockMenu } from '../services/dashboard.service';

export function useLockMenu() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => lockMenu(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.menu.today });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.today });
    },
    onError: (error: Error) => {
      toast.error(error.message ?? 'Không thể chốt sổ');
    },
  });
}
