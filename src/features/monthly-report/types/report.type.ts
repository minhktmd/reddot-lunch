import { z } from 'zod';

// --- Monthly report summary ---

export const monthlyReportRowSchema = z.object({
  employee: z.object({ id: z.string(), name: z.string() }),
  daysOrdered: z.number(),
  totalPortions: z.number(),
  totalAmount: z.number(),
  paidAmount: z.number(),
  unpaidAmount: z.number(),
});

export type MonthlyReportRow = z.infer<typeof monthlyReportRowSchema>;

export const monthlyReportResponseSchema = z.object({
  month: z.string(),
  rows: z.array(monthlyReportRowSchema),
});

export type MonthlyReportResponse = z.infer<typeof monthlyReportResponseSchema>;

// --- Employee daily detail ---

export const employeeDailyOrderSchema = z.object({
  date: z.string(),
  menuItemName: z.string(),
  quantity: z.number(),
  unitPrice: z.number(),
  subtotal: z.number(),
  isPaid: z.boolean(),
});

export type EmployeeDailyOrder = z.infer<typeof employeeDailyOrderSchema>;

export const employeeReportResponseSchema = z.object({
  employee: z.object({ id: z.string(), name: z.string() }),
  month: z.string(),
  orders: z.array(employeeDailyOrderSchema),
});

export type EmployeeReportResponse = z.infer<typeof employeeReportResponseSchema>;
