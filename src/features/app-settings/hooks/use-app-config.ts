import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/shared/constants/query-keys';

import { getAppConfig } from '../services/app-config.service';

export function useAppConfig() {
  return useQuery({
    queryKey: queryKeys.appConfig,
    queryFn: getAppConfig,
  });
}
