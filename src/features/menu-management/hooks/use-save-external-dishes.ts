'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import type { ExternalDishItem } from '@/domains/menu';
import { queryKeys } from '@/shared/constants/query-keys';

import { saveExternalDishes } from '../services/menu-management.service';

type SaveExternalDishesInput = {
  menuId: string;
  externalDishes: ExternalDishItem[];
};

export function useSaveExternalDishes() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ menuId, externalDishes }: SaveExternalDishesInput) =>
      saveExternalDishes(menuId, externalDishes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.menu.today });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Không thể lưu món ăn ngoài');
    },
  });
}
