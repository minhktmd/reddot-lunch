'use client';

import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/shared/constants/query-keys';

import { getTodayMenu } from '../services/menu.service';

export function useTodayMenu() {
  return useQuery({
    queryKey: queryKeys.menu.today,
    queryFn: getTodayMenu,
    refetchInterval: 30_000,
  });
}
