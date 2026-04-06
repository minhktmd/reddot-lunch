import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { queryKeys } from '@/shared/constants/query-keys';

import { saveMenuItems } from '../services/menu-management.service';
import { useMenuDraftStore } from '../stores/menu-draft.store';
import { type SaveMenuItemsInput, type SaveMenuItemsBlockedError } from '../types/menu-management.type';

export function useSaveMenuItems(menuId: string) {
  const queryClient = useQueryClient();
  const markSaved = useMenuDraftStore((s) => s.markSaved);

  return useMutation({
    mutationFn: (input: SaveMenuItemsInput) => saveMenuItems(menuId, input),
    onSuccess: () => {
      markSaved();
      queryClient.invalidateQueries({ queryKey: queryKeys.menu.today });
      toast.success('Đã lưu thay đổi');
    },
    onError: (error: unknown) => {
      // Check for blocked error (409 with blockedNames)
      const axiosError = error as { response?: { status?: number; data?: SaveMenuItemsBlockedError } };
      if (axiosError.response?.status === 409 && axiosError.response?.data?.blockedNames) {
        const names = axiosError.response.data.blockedNames.join(', ');
        toast.error(`Không thể xóa: ${names} đã có đơn hàng`);
        return;
      }
      const message = error instanceof Error ? error.message : 'Lưu thay đổi thất bại';
      toast.error(message);
    },
  });
}
