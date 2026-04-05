import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { queryKeys } from '@/shared/constants/query-keys'

import { updateMenu } from '../services/menu-management.service'
import { type UpdateMenuInput } from '../types/menu-management.type'

export function useUpdateMenu(menuId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: UpdateMenuInput) => updateMenu(menuId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.menu.today })
    },
    onError: (error: Error) => {
      toast.error(error.message ?? 'Cập nhật thực đơn thất bại')
    },
  })
}
