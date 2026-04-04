import { logger } from '@/shared/lib/logger';
import { apiClient } from '@/shared/services/api';

import { authResponseSchema, type AuthResponse, type LoginPayload } from '../types/auth.type';

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  const response = await apiClient.post<unknown>('/auth/login', payload);
  const result = authResponseSchema.safeParse(response.data);

  if (!result.success) {
    logger.error('login: invalid response shape', result.error);
    throw new Error('Unexpected response from server');
  }

  return result.data;
}

export async function logout(): Promise<void> {
  await apiClient.post('/auth/logout');
}
