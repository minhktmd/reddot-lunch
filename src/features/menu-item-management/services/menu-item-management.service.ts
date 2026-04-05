import { z } from 'zod';

import { logger } from '@/shared/lib/logger';
import { apiClient } from '@/shared/services/api';

import { type MenuItemListItem } from '../types/menu-item-management.type';

const menuItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  isActive: z.boolean(),
  createdAt: z.string(),
});

const menuItemListSchema = z.array(menuItemSchema);

export async function getAllMenuItems(): Promise<MenuItemListItem[]> {
  const response = await apiClient.get<unknown>('/api/menu-items', {
    params: { includeInactive: true },
  });

  const result = menuItemListSchema.safeParse(response.data);
  if (!result.success) {
    logger.error('[getAllMenuItems] Invalid response', result.error);
    return [];
  }

  return result.data;
}

export async function addMenuItem(data: { name: string }): Promise<MenuItemListItem> {
  const response = await apiClient.post<unknown>('/api/menu-items', { name: data.name });

  const result = menuItemSchema.safeParse(response.data);
  if (!result.success) {
    logger.error('[addMenuItem] Invalid response', result.error);
    throw new Error('Phản hồi không hợp lệ');
  }

  return result.data;
}

export async function editMenuItem(
  id: string,
  data: { name?: string; isActive?: boolean }
): Promise<MenuItemListItem> {
  const response = await apiClient.patch<unknown>(`/api/menu-items/${id}`, data);

  const result = menuItemSchema.safeParse(response.data);
  if (!result.success) {
    logger.error('[editMenuItem] Invalid response', result.error);
    throw new Error('Phản hồi không hợp lệ');
  }

  return result.data;
}
