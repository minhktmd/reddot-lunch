import { z } from 'zod';

export const orderItemSchema = z.object({
  id: z.string(),
  quantity: z.number(),
  isAutoOrder: z.boolean(),
  isPaid: z.boolean(),
  paidAt: z.string().nullable(),
  menuOfDayItem: z.object({
    id: z.string(),
    price: z.number(),
    sideDishes: z.string().nullable(),
    menuItem: z.object({ id: z.string(), name: z.string() }),
  }),
});

export type OrderItem = z.infer<typeof orderItemSchema>;

export const unpaidOrderItemSchema = z.object({
  id: z.string(),
  quantity: z.number(),
  isPaid: z.literal(false),
  menuOfDay: z.object({ id: z.string(), date: z.string() }),
  menuOfDayItem: z.object({
    id: z.string(),
    price: z.number(),
    menuItem: z.object({ id: z.string(), name: z.string() }),
  }),
});

export type UnpaidOrderItem = z.infer<typeof unpaidOrderItemSchema>;

export const appConfigSchema = z.object({
  id: z.string(),
  qrCodeUrl: z.string().nullable(),
  updatedAt: z.string().nullable(),
});

export type AppConfigData = z.infer<typeof appConfigSchema>;
