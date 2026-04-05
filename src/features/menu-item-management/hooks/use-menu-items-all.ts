import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/shared/constants/query-keys';

import { getAllMenuItems } from '../services/menu-item-management.service';

export function useMenuItemsAll() {
  return useQuery({
    queryKey: queryKeys.menuItems.all,
    queryFn: getAllMenuItems,
  });
}
