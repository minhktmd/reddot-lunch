import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { queryKeys } from '@/shared/constants/query-keys';

import { saveBankConfig } from '../services/app-config.service';

export function useSaveBankConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: saveBankConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.appConfig });
      toast.success('Đã lưu thông tin tài khoản');
    },
    onError: () => {
      toast.error('Lưu thất bại. Vui lòng thử lại.');
    },
  });
}
