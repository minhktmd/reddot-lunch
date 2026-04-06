'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { queryKeys } from '@/shared/constants/query-keys';
import { getTodayVNDateString } from '@/shared/utils/format';

import { editOrder } from '../services/order.service';

import type { OrderItem } from '../types/order.type';
import type { TodayMenuResponse } from '@/domains/menu';

type EditOrderVariables = {
  id: string;
  menuOfDayItemId?: string;
  quantity?: number;
};

export function useEditOrder(employeeId: string) {
  const queryClient = useQueryClient();
  const date = getTodayVNDateString();
  const queryKey = queryKeys.orders.byEmployee(employeeId, date);

  return useMutation({
    mutationFn: ({ id, menuOfDayItemId, quantity }: EditOrderVariables) =>
      editOrder(id, { menuOfDayItemId, quantity }),
    onMutate: async (variables: EditOrderVariables) => {
      await queryClient.cancelQueries({ queryKey });
      const prev = queryClient.getQueryData<OrderItem[]>(queryKey);

      const menuData = queryClient.getQueryData<TodayMenuResponse | null>(queryKeys.menu.today);
      const menuItems = menuData?.status === 'exists' ? menuData.menu.items : [];

      queryClient.setQueryData<OrderItem[]>(queryKey, (old) =>
        old?.map((order) => {
          if (order.id !== variables.id) return order;

          const newItem = variables.menuOfDayItemId
            ? (menuItems.find((i) => i.id === variables.menuOfDayItemId) ?? order.menuOfDayItem)
            : order.menuOfDayItem;

          return {
            ...order,
            quantity: variables.quantity ?? order.quantity,
            menuOfDayItem: newItem,
          };
        }) ?? []
      );

      return { prev };
    },
    onError: (_err, _vars, context) => {
      queryClient.setQueryData(queryKey, context?.prev);
      toast.error('Không thể sửa đơn. Vui lòng thử lại.');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.byEmployee(employeeId, date) });
      toast.success('Đã cập nhật đơn');
    },
  });
}
