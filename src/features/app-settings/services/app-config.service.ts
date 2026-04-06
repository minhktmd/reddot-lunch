import { logger } from '@/shared/lib/logger';
import { apiClient } from '@/shared/services/api';

import { appConfigResponseSchema, type AppConfigResponse } from '../types/app-config.type';

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

export async function getAppConfig(): Promise<AppConfigResponse> {
  const response = await apiClient.get('/api/app-config');
  const result = appConfigResponseSchema.safeParse(response.data);

  if (!result.success) {
    logger.error('[getAppConfig] Invalid response', result.error);
    throw new Error('Invalid app config response');
  }

  return result.data;
}

export async function uploadQRCode(file: File): Promise<AppConfigResponse> {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('FILE_TOO_LARGE');
  }

  const formData = new FormData();
  formData.append('file', file);

  const response = await apiClient.post('/api/app-config/qr', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  const result = appConfigResponseSchema.safeParse(response.data);

  if (!result.success) {
    logger.error('[uploadQRCode] Invalid response', result.error);
    throw new Error('Invalid app config response');
  }

  return result.data;
}
