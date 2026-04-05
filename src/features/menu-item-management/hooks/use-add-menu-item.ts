'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { queryKeys } from '@/shared/constants/query-keys';

import { getAllMenuItems, addMenuItem } from '../services/menu-item-management.service';
import { type AddMenuItemInput } from '../types/menu-item-management.type';

export function useAddMenuItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AddMenuItemInput) => addMenuItem({ name: data.name }),
    onMutate: async (data) => {
      // Check for duplicate name (case-insensitive) — warn but don't block
      const existing = queryClient.getQueryData<Awaited<ReturnType<typeof getAllMenuItems>>>(queryKeys.menuItems.all);
      if (existing) {
        const duplicate = existing.find((item) => item.name.toLowerCase() === data.name.trim().toLowerCase());
        if (duplicate) {
          toast.warning(`Món "${duplicate.name}" đã tồn tại. Vẫn tiếp tục thêm.`);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.menuItems.all });
      toast.success('Thêm món thành công');
    },
    onError: (error: Error) => {
      toast.error(error.message ?? 'Thêm món thất bại');
    },
  });
}
