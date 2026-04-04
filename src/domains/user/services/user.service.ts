import { logger } from '@/shared/lib/logger';
import { apiClient } from '@/shared/services/api';

import { userSchema, type User } from '../types/user.type';

export async function getMe(): Promise<User> {
  const response = await apiClient.get<unknown>('/auth/me');
  const result = userSchema.safeParse(response.data);

  if (!result.success) {
    logger.error('getMe: invalid response shape', result.error);
    throw new Error('Invalid user response from server');
  }

  return result.data;
}

export async function getUserById(id: string): Promise<User> {
  const response = await apiClient.get<unknown>(`/users/${id}`);
  const result = userSchema.safeParse(response.data);

  if (!result.success) {
    logger.error('getUserById: invalid response shape', result.error);
    throw new Error('Invalid user response from server');
  }

  return result.data;
}
