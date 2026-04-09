import { z } from 'zod';

export const orderItemSchema = z.object({
  id: z.string(),
  quantity: z.number(),
  isAutoOrder: z.boolean(),
  menuOfDayItem: z.object({
    id: z.string(),
    name: z.string(),
    price: z.number(),
    sideDishes: z.string().nullable(),
  }),
});

export type OrderItem = z.infer<typeof orderItemSchema>;

export const appConfigSchema = z.object({
  id: z.string(),
  qrCodeUrl: z.string().nullable(),
  updatedAt: z.string().nullable(),
});

export type AppConfigData = z.infer<typeof appConfigSchema>;
