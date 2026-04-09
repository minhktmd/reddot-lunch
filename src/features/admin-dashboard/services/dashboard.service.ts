import { z } from 'zod';

import { logger } from '@/shared/lib/logger';
import { apiClient } from '@/shared/services/api';

import { todayAdminOrderSchema, type TodayAdminOrder } from '../types/admin-dashboard.type';

import type { TodayMenuResponse, MenuOfDayResponse } from '@/domains/menu';

// ─── Menu ────────────────────────────────────────────────────────────────────

const menuOfDayItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number(),
  sideDishes: z.string().nullable(),
});

const menuOfDaySchema = z.object({
  id: z.string(),
  date: z.string(),
  isPublished: z.boolean(),
  isLocked: z.boolean(),
  items: z.array(menuOfDayItemSchema),
});

const prefillItemSchema = z.object({
  name: z.string(),
  price: z.number(),
  sideDishes: z.string().nullable(),
});

const todayMenuResponseSchema = z.discriminatedUnion('status', [
  z.object({ status: z.literal('exists'), menu: menuOfDaySchema }),
  z.object({ status: z.literal('prefill'), items: z.array(prefillItemSchema) }),
]);

export async function getTodayMenu(): Promise<TodayMenuResponse | null> {
  const response = await apiClient.get<unknown>('/api/menu/today');
  const result = todayMenuResponseSchema.safeParse(response.data);
  if (!result.success) {
    logger.error('[admin getTodayMenu] Invalid response', result.error);
    return null;
  }
  return result.data as TodayMenuResponse;
}

export async function lockMenu(id: string): Promise<MenuOfDayResponse> {
  const response = await apiClient.post<unknown>(`/api/menu/${id}/lock`);
  const result = menuOfDaySchema.safeParse(response.data);
  if (!result.success) {
    logger.error('[lockMenu] Invalid response', result.error);
    throw new Error('Phản hồi không hợp lệ');
  }
  return result.data as MenuOfDayResponse;
}

export async function unlockMenu(id: string): Promise<MenuOfDayResponse> {
  const response = await apiClient.post<unknown>(`/api/menu/${id}/unlock`);
  const result = menuOfDaySchema.safeParse(response.data);
  if (!result.success) {
    logger.error('[unlockMenu] Invalid response', result.error);
    throw new Error('Phản hồi không hợp lệ');
  }
  return result.data as MenuOfDayResponse;
}

// ─── Orders ──────────────────────────────────────────────────────────────────

export async function getTodayAdminOrders(): Promise<TodayAdminOrder[]> {
  const response = await apiClient.get<unknown>('/api/orders/today');
  const result = z.array(todayAdminOrderSchema).safeParse(response.data);
  if (!result.success) {
    logger.error('[getTodayAdminOrders] Invalid response', result.error);
    return [];
  }
  return result.data;
}

