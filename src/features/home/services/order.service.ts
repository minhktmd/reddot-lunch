import { z } from 'zod';

import { logger } from '@/shared/lib/logger';
import { apiClient } from '@/shared/services/api';

import { orderItemSchema, type OrderItem } from '../types/order.type';

type PlaceOrderInput = {
  employeeId: string;
  menuOfDayItemId: string;
  quantity: number;
};

type EditOrderInput = {
  menuOfDayItemId?: string;
  quantity?: number;
};

export async function getTodayOrders(employeeId: string, date: string): Promise<OrderItem[]> {
  const response = await apiClient.get<unknown>('/api/orders', { params: { employeeId, date } });
  const result = z.array(orderItemSchema).safeParse(response.data);
  if (!result.success) {
    logger.error('[getTodayOrders] Invalid response', result.error);
    return [];
  }
  return result.data;
}

export async function placeOrder(data: PlaceOrderInput): Promise<OrderItem> {
  const response = await apiClient.post<unknown>('/api/orders', data);
  const result = orderItemSchema.safeParse(response.data);
  if (!result.success) {
    logger.error('[placeOrder] Invalid response', result.error);
    throw new Error('Phản hồi không hợp lệ');
  }
  return result.data;
}

export async function editOrder(id: string, data: EditOrderInput): Promise<OrderItem> {
  const response = await apiClient.patch<unknown>(`/api/orders/${id}`, data);
  const result = orderItemSchema.safeParse(response.data);
  if (!result.success) {
    logger.error('[editOrder] Invalid response', result.error);
    throw new Error('Phản hồi không hợp lệ');
  }
  return result.data;
}

export async function cancelOrder(id: string): Promise<void> {
  await apiClient.delete(`/api/orders/${id}`);
}

