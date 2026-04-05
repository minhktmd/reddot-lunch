'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { queryKeys } from '@/shared/constants/query-keys';
import { payAllOrders } from '../services/order.service';

export function usePayAll(employeeId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => payAllOrders(employeeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.unpaid(employeeId) });
      toast.success('Đã xác nhận thanh toán!');
    },
    onError: () => {
      toast.error('Không thể xác nhận thanh toán. Vui lòng thử lại.');
    },
  });
}
