'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { queryKeys } from '@/shared/constants/query-keys';
import { getTodayVNDateString } from '@/shared/utils/format';
import { placeOrder } from '../services/order.service';
import type { OrderItem } from '../types/order.type';
import type { TodayMenuResponse } from '@/domains/menu';

type PlaceOrderVariables = {
  employeeId: string;
  menuOfDayItemId: string;
  quantity: number;
};

export function usePlaceOrder(employeeId: string) {
  const queryClient = useQueryClient();
  const date = getTodayVNDateString();
  const queryKey = queryKeys.orders.byEmployee(employeeId, date);

  return useMutation({
    mutationFn: placeOrder,
    onMutate: async (variables: PlaceOrderVariables) => {
      await queryClient.cancelQueries({ queryKey });
      const prev = queryClient.getQueryData<OrderItem[]>(queryKey);

      const menuData = queryClient.getQueryData<TodayMenuResponse | null>(queryKeys.menu.today);
      const menuItems = menuData?.status === 'exists' ? menuData.menu.items : [];
      const menuOfDayItem = menuItems.find((item) => item.id === variables.menuOfDayItemId) ?? {
        id: variables.menuOfDayItemId,
        price: 0,
        sideDishes: null,
        menuItem: { id: '', name: '...' },
      };

      const optimistic: OrderItem = {
        id: `opt-${Date.now()}`,
        quantity: variables.quantity,
        isAutoOrder: false,
        isPaid: false,
        paidAt: null,
        menuOfDayItem,
      };

      queryClient.setQueryData<OrderItem[]>(queryKey, (old) => [...(old ?? []), optimistic]);
      return { prev };
    },
    onError: (_err, _vars, context) => {
      queryClient.setQueryData(queryKey, context?.prev);
      toast.error('Không thể đặt món. Vui lòng thử lại.');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.byEmployee(employeeId, date) });
      toast.success('Đặt món thành công');
    },
  });
}
