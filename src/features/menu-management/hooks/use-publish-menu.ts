import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { queryKeys } from '@/shared/constants/query-keys';

import { publishMenu } from '../services/menu-management.service';
import { useMenuDraftStore } from '../stores/menu-draft.store';
import { type PublishMenuInput } from '../types/menu-management.type';

export function usePublishMenu() {
  const queryClient = useQueryClient();
  const reset = useMenuDraftStore((s) => s.reset);

  return useMutation({
    mutationFn: (input: PublishMenuInput) => publishMenu(input),
    onSuccess: () => {
      reset();
      queryClient.invalidateQueries({ queryKey: queryKeys.menu.today });
      toast.success('Đăng thực đơn thành công');
    },
    onError: (error: Error) => {
      toast.error(error.message ?? 'Đăng thực đơn thất bại');
    },
  });
}
