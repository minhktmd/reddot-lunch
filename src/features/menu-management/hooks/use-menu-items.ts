import { useQuery } from '@tanstack/react-query'

import { queryKeys } from '@/shared/constants/query-keys'

import { getMenuItems } from '../services/menu-management.service'

export function useMenuItems() {
  return useQuery({
    queryKey: queryKeys.menuItems.all,
    queryFn: getMenuItems,
  })
}
