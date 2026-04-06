'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { getEmployees } from '@/domains/employee';
import { getTodayMenu } from '@/features/home';
import { queryKeys } from '@/shared/constants/query-keys';
import { Providers as SharedProviders } from '@/shared/providers';

function Prefetcher() {
  const queryClient = useQueryClient();

  useEffect(() => {
    queryClient.prefetchQuery({ queryKey: queryKeys.employees.all, queryFn: getEmployees });
    queryClient.prefetchQuery({ queryKey: queryKeys.menu.today, queryFn: getTodayMenu });
  }, [queryClient]);

  return null;
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <SharedProviders>
      <Prefetcher />
      {children}
    </SharedProviders>
  );
}
