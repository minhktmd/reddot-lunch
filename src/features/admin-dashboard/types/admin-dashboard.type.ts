import { z } from 'zod';

export const todayAdminOrderSchema = z.object({
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

export type TodayAdminOrder = z.infer<typeof todayAdminOrderSchema>;

export type MealSummaryItem = {
  name: string;
  quantity: number;
};
