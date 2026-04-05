'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { queryKeys } from '@/shared/constants/query-keys';
import { getTodayVNDateString } from '@/shared/utils/format';

import { cancelOrder } from '../services/order.service';

import type { OrderItem } from '../types/order.type';

export function useCancelOrder(employeeId: string) {
  const queryClient = useQueryClient();
  const date = getTodayVNDateString();
  const queryKey = queryKeys.orders.byEmployee(employeeId, date);

  return useMutation({
    mutationFn: (orderId: string) => cancelOrder(orderId),
    onMutate: async (orderId: string) => {
      await queryClient.cancelQueries({ queryKey });
      const prev = queryClient.getQueryData<OrderItem[]>(queryKey);
      queryClient.setQueryData<OrderItem[]>(queryKey, (old) => old?.filter((o) => o.id !== orderId) ?? []);
      return { prev };
    },
    onError: (_err, _vars, context) => {
      queryClient.setQueryData(queryKey, context?.prev);
      toast.error('Không thể hủy đơn. Vui lòng thử lại.');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.byEmployee(employeeId, date) });
      toast.success('Đã hủy đơn');
    },
  });
}
