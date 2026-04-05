'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { queryKeys } from '@/shared/constants/query-keys';
import { unpayOrders } from '../services/dashboard.service';

type UnpayInput = {
  employeeId: string;
  date: string;
};

export function useUnpayOrders() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ employeeId, date }: UnpayInput) => unpayOrders(employeeId, date),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.today });
      toast.success('Đã hoàn tác thanh toán');
    },
    onError: (error: Error) => {
      toast.error(error.message ?? 'Không thể hoàn tác');
    },
  });
}
