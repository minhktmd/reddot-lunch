'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { queryKeys } from '@/shared/constants/query-keys';

import { topup } from '../services/finance.service';

export function useTopup(employeeId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (amount: number) => topup({ employeeId, amount }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.finance.balance(employeeId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.finance.ledger(employeeId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.finance.summary() });
      toast.success('Nạp tiền thành công');
    },
    onError: () => {
      toast.error('Không thể nạp tiền. Vui lòng thử lại.');
    },
  });
}
