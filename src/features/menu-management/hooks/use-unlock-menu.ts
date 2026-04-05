import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { queryKeys } from '@/shared/constants/query-keys'

import { unlockMenu } from '../services/menu-management.service'

export function useUnlockMenu() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (menuId: string) => unlockMenu(menuId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.menu.today })
      toast.success('Đã mở lại thực đơn')
    },
    onError: (error: Error) => {
      toast.error(error.message ?? 'Mở lại thất bại')
    },
  })
}
