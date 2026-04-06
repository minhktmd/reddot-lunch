import { z } from 'zod';

import { logger } from '@/shared/lib/logger';
import { apiClient } from '@/shared/services/api';

import type { TodayMenuResponse } from '@/domains/menu';

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
    logger.error('[getTodayMenu] Invalid response', result.error);
    return null;
  }
  return result.data as TodayMenuResponse;
}
