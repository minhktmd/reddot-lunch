import { z } from 'zod'

import { type MenuItemCatalogItem, type MenuOfDayResponse, type TodayMenuResponse, type TodayOrderItem } from '@/domains/menu'
import { apiClient } from '@/shared/services/api'
import { logger } from '@/shared/lib/logger'

import { type PublishMenuInput, type UpdateMenuInput } from '../types/menu-management.type'

// ─── Schemas ─────────────────────────────────────────────────────────────────

const menuItemSchema = z.object({
  id: z.string(),
  name: z.string(),
})

const menuOfDayItemSchema = z.object({
  id: z.string(),
  price: z.number(),
  sideDishes: z.string().nullable(),
  menuItem: menuItemSchema,
})

const menuOfDaySchema = z.object({
  id: z.string(),
  date: z.string(),
  isPublished: z.boolean(),
  isLocked: z.boolean(),
  items: z.array(menuOfDayItemSchema),
})

const todayMenuSchema = z.discriminatedUnion('status', [
  z.object({
    status: z.literal('exists'),
    menu: menuOfDaySchema,
  }),
  z.object({
    status: z.literal('prefill'),
    items: z.array(
      z.object({
        menuItemId: z.string(),
        menuItemName: z.string(),
        price: z.number(),
        sideDishes: z.string().nullable(),
      })
    ),
  }),
])

const menuItemCatalogSchema = z.object({
  id: z.string(),
  name: z.string(),
  isActive: z.boolean(),
  createdAt: z.string(),
  lastUsedPrice: z.number().nullable(),
  lastUsedSideDishes: z.string().nullable(),
})

const menuItemCatalogListSchema = z.array(menuItemCatalogSchema)

const todayOrderItemSchema = z.object({
  id: z.string(),
  quantity: z.number(),
  isAutoOrder: z.boolean(),
  isPaid: z.boolean(),
  paidAt: z.string().nullable(),
  employee: z.object({ id: z.string(), name: z.string() }),
  menuOfDayItem: z.object({
    id: z.string(),
    price: z.number(),
    menuItem: z.object({ id: z.string(), name: z.string() }),
  }),
})

const todayOrdersSchema = z.array(todayOrderItemSchema)

// ─── Service functions ────────────────────────────────────────────────────────

export async function getTodayMenu(): Promise<TodayMenuResponse> {
  const response = await apiClient.get<unknown>('/api/menu/today')
  const result = todayMenuSchema.safeParse(response.data)
  if (!result.success) {
    logger.error('[getTodayMenu] Invalid response', result.error)
    throw new Error('Phản hồi không hợp lệ')
  }
  return result.data
}

export async function getMenuItems(): Promise<MenuItemCatalogItem[]> {
  const response = await apiClient.get<unknown>('/api/menu-items')
  const result = menuItemCatalogListSchema.safeParse(response.data)
  if (!result.success) {
    logger.error('[getMenuItems] Invalid response', result.error)
    return []
  }
  return result.data
}

export async function publishMenu(input: PublishMenuInput): Promise<MenuOfDayResponse> {
  const response = await apiClient.post<unknown>('/api/menu/publish', input)
  const result = menuOfDaySchema.safeParse(response.data)
  if (!result.success) {
    logger.error('[publishMenu] Invalid response', result.error)
    throw new Error('Phản hồi không hợp lệ')
  }
  return result.data
}

export async function updateMenu(id: string, input: UpdateMenuInput): Promise<MenuOfDayResponse> {
  const response = await apiClient.patch<unknown>(`/api/menu/${id}`, input)
  const result = menuOfDaySchema.safeParse(response.data)
  if (!result.success) {
    logger.error('[updateMenu] Invalid response', result.error)
    throw new Error('Phản hồi không hợp lệ')
  }
  return result.data
}

export async function lockMenu(id: string): Promise<MenuOfDayResponse> {
  const response = await apiClient.post<unknown>(`/api/menu/${id}/lock`)
  const result = menuOfDaySchema.safeParse(response.data)
  if (!result.success) {
    logger.error('[lockMenu] Invalid response', result.error)
    throw new Error('Phản hồi không hợp lệ')
  }
  return result.data
}

export async function unlockMenu(id: string): Promise<MenuOfDayResponse> {
  const response = await apiClient.post<unknown>(`/api/menu/${id}/unlock`)
  const result = menuOfDaySchema.safeParse(response.data)
  if (!result.success) {
    logger.error('[unlockMenu] Invalid response', result.error)
    throw new Error('Phản hồi không hợp lệ')
  }
  return result.data
}

export async function getTodayOrders(): Promise<TodayOrderItem[]> {
  const response = await apiClient.get<unknown>('/api/orders/today')
  const result = todayOrdersSchema.safeParse(response.data)
  if (!result.success) {
    logger.error('[getTodayOrders] Invalid response', result.error)
    return []
  }
  return result.data
}
