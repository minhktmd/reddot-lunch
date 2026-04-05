import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { queryKeys } from '@/shared/constants/query-keys';

import { editMenuItem } from '../services/menu-item-management.service';
import { type EditMenuItemInput } from '../types/menu-item-management.type';

type EditMenuItemParams = EditMenuItemInput & { id: string };

export function useEditMenuItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...data }: EditMenuItemParams) => editMenuItem(id, { name: data.name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.menuItems.all });
      toast.success('Cập nhật món thành công');
    },
    onError: (error: Error) => {
      toast.error(error.message ?? 'Cập nhật món thất bại');
    },
  });
}

type ToggleActiveParams = { id: string; isActive: boolean };

export function useToggleMenuItemActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isActive }: ToggleActiveParams) => editMenuItem(id, { isActive }),
    onSuccess: (_, { isActive }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.menuItems.all });
      toast.success(isActive ? 'Đã kích hoạt món' : 'Đã vô hiệu hóa món');
    },
    onError: (error: Error) => {
      toast.error(error.message ?? 'Cập nhật trạng thái thất bại');
    },
  });
}
