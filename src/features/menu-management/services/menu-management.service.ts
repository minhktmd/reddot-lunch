import { z } from 'zod';

import {
  type ExternalDishItem,
  type MenuOfDayResponse,
  type MenuSuggestion,
  type TodayMenuResponse,
  type TodayOrderItem,
} from '@/domains/menu';
import { logger } from '@/shared/lib/logger';
import { apiClient } from '@/shared/services/api';

import { type PublishMenuInput, type SaveMenuItemsInput } from '../types/menu-management.type';

// ─── Schemas ─────────────────────────────────────────────────────────────────

const menuOfDayItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number(),
  sideDishes: z.string().nullable(),
});

const externalDishItemSchema = z.object({
  name: z.string(),
  orderUrl: z.string(),
});

const menuOfDaySchema = z.object({
  id: z.string(),
  date: z.string(),
  isPublished: z.boolean(),
  isLocked: z.boolean(),
  items: z.array(menuOfDayItemSchema),
  externalDishes: z.array(externalDishItemSchema),
});

const todayMenuSchema = z.discriminatedUnion('status', [
  z.object({
    status: z.literal('exists'),
    menu: menuOfDaySchema,
  }),
  z.object({
    status: z.literal('prefill'),
    items: z.array(
      z.object({
        name: z.string(),
        price: z.number(),
        sideDishes: z.string().nullable(),
      })
    ),
  }),
]);

const suggestionsResponseSchema = z.object({
  suggestions: z.array(
    z.object({
      name: z.string(),
      price: z.number(),
    })
  ),
});

const todayOrderItemSchema = z.object({
  id: z.string(),
  quantity: z.number(),
  isAutoOrder: z.boolean(),
  employee: z.object({ id: z.string(), name: z.string() }),
  menuOfDayItem: z.object({
    id: z.string(),
    name: z.string(),
    price: z.number(),
  }),
});

const todayOrdersSchema = z.array(todayOrderItemSchema);

// ─── Service functions ────────────────────────────────────────────────────────

export async function getTodayMenu(): Promise<TodayMenuResponse> {
  const response = await apiClient.get<unknown>('/api/menu/today');
  const result = todayMenuSchema.safeParse(response.data);
  if (!result.success) {
    logger.error('[getTodayMenu] Invalid response', result.error);
    throw new Error('Phản hồi không hợp lệ');
  }
  return result.data;
}

export async function getMenuSuggestions(): Promise<MenuSuggestion[]> {
  const response = await apiClient.get<unknown>('/api/menu/suggestions');
  const result = suggestionsResponseSchema.safeParse(response.data);
  if (!result.success) {
    logger.error('[getMenuSuggestions] Invalid response', result.error);
    return [];
  }
  return result.data.suggestions;
}

export async function publishMenu(input: PublishMenuInput): Promise<MenuOfDayResponse> {
  const response = await apiClient.post<unknown>('/api/menu/publish', input);
  const result = menuOfDaySchema.safeParse(response.data);
  if (!result.success) {
    logger.error('[publishMenu] Invalid response', result.error);
    throw new Error('Phản hồi không hợp lệ');
  }
  return result.data;
}

export async function saveMenuItems(id: string, input: SaveMenuItemsInput): Promise<MenuOfDayResponse> {
  const response = await apiClient.patch<unknown>(`/api/menu/${id}/items`, input);
  const result = menuOfDaySchema.safeParse(response.data);
  if (!result.success) {
    logger.error('[saveMenuItems] Invalid response', result.error);
    throw new Error('Phản hồi không hợp lệ');
  }
  return result.data;
}

export async function lockMenu(id: string): Promise<MenuOfDayResponse> {
  const response = await apiClient.post<unknown>(`/api/menu/${id}/lock`);
  const result = menuOfDaySchema.safeParse(response.data);
  if (!result.success) {
    logger.error('[lockMenu] Invalid response', result.error);
    throw new Error('Phản hồi không hợp lệ');
  }
  return result.data;
}

export async function unlockMenu(id: string): Promise<MenuOfDayResponse> {
  const response = await apiClient.post<unknown>(`/api/menu/${id}/unlock`);
  const result = menuOfDaySchema.safeParse(response.data);
  if (!result.success) {
    logger.error('[unlockMenu] Invalid response', result.error);
    throw new Error('Phản hồi không hợp lệ');
  }
  return result.data;
}

export async function getTodayOrders(): Promise<TodayOrderItem[]> {
  const response = await apiClient.get<unknown>('/api/orders/today');
  const result = todayOrdersSchema.safeParse(response.data);
  if (!result.success) {
    logger.error('[getTodayOrders] Invalid response', result.error);
    return [];
  }
  return result.data;
}

const saveExternalDishesResponseSchema = z.object({
  externalDishes: z.array(externalDishItemSchema),
});

export async function saveExternalDishes(
  menuId: string,
  externalDishes: ExternalDishItem[]
): Promise<ExternalDishItem[]> {
  const response = await apiClient.patch<unknown>(`/api/menu/${menuId}/external-dishes`, { externalDishes });
  const result = saveExternalDishesResponseSchema.safeParse(response.data);
  if (!result.success) {
    logger.error('[saveExternalDishes] Invalid response', result.error);
    throw new Error('Phản hồi không hợp lệ');
  }
  return result.data.externalDishes;
}
