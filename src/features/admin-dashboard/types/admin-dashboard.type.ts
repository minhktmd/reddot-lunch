import { z } from 'zod';

export const todayAdminOrderSchema = z.object({
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
});

export type TodayAdminOrder = z.infer<typeof todayAdminOrderSchema>;

export type MealSummaryItem = {
  name: string;
  quantity: number;
};

export type EmployeePayment = {
  employeeId: string;
  employeeName: string;
  totalAmount: number;
  paidAt: string | null;
};
