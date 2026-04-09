import { logger } from '@/shared/lib/logger';
import { apiClient } from '@/shared/services/api';

import {
  appConfigResponseSchema,
  type AppConfigResponse,
  type SaveBankConfigInput,
} from '../types/app-config.type';

export async function getAppConfig(): Promise<AppConfigResponse> {
  const response = await apiClient.get('/api/app-config');
  const result = appConfigResponseSchema.safeParse(response.data);

  if (!result.success) {
    logger.error('[getAppConfig] Invalid response', result.error);
    throw new Error('Invalid app config response');
  }

  return result.data;
}

export async function saveBankConfig(data: SaveBankConfigInput): Promise<AppConfigResponse> {
  const response = await apiClient.post('/api/app-config/bank', data);
  const result = appConfigResponseSchema.safeParse(response.data);

  if (!result.success) {
    logger.error('[saveBankConfig] Invalid response', result.error);
    throw new Error('Invalid app config response');
  }

  return result.data;
}
