'use client';

import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/shared/constants/query-keys';

import { getMe } from '../services/user.service';

export function useGetMe() {
  return useQuery({
    queryKey: queryKeys.users.me(),
    queryFn: getMe,
  });
}
