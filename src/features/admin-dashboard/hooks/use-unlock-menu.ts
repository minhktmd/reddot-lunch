'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { queryKeys } from '@/shared/constants/query-keys';
import { unlockMenu } from '../services/dashboard.service';

export function useUnlockMenu() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => unlockMenu(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.menu.today });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.today });
    },
    onError: (error: Error) => {
      toast.error(error.message ?? 'Không thể mở lại');
    },
  });
}
