import { logger } from '@/shared/lib/logger';
import { apiClient } from '@/shared/services/api';

import { appConfigSchema, type AppConfigData } from '../types/order.type';

export async function getAppConfig(): Promise<AppConfigData | null> {
  const response = await apiClient.get<unknown>('/api/app-config');
  const result = appConfigSchema.safeParse(response.data);
  if (!result.success) {
    logger.error('[getAppConfig] Invalid response', result.error);
    return null;
  }
  return result.data;
}
