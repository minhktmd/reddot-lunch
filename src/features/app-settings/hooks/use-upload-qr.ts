import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { queryKeys } from '@/shared/constants/query-keys';

import { uploadQRCode } from '../services/app-config.service';

export function useUploadQR() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: uploadQRCode,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.appConfig });
      toast.success('Tải ảnh QR lên thành công');
    },
    onError: (error: Error) => {
      if (error.message === 'FILE_TOO_LARGE') {
        toast.error('Ảnh vượt quá 2MB. Vui lòng chọn ảnh nhỏ hơn.');
      } else {
        toast.error('Tải ảnh QR thất bại. Vui lòng thử lại.');
      }
    },
  });
}
