'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { queryKeys } from '@/shared/constants/query-keys';

import { adjustBalance } from '../services/finance.service';

type AdjustVariables = {
  employeeId: string;
  targetBalance: number;
  note?: string;
  adminEmployeeId: string;
};

export function useAdjustBalance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: adjustBalance,
    onSuccess: (_data, variables: AdjustVariables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.finance.balance(variables.employeeId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.finance.summary() });
      toast.success('Đã cập nhật số dư');
    },
    onError: () => {
      toast.error('Không thể cập nhật số dư. Vui lòng thử lại.');
    },
  });
}
