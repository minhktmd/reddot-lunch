import { z } from 'zod';

export const balanceResponseSchema = z.object({
  employeeId: z.string(),
  balance: z.number(),
});

export type BalanceResponse = z.infer<typeof balanceResponseSchema>;

export const ledgerEntryItemSchema = z.object({
  id: z.string(),
  amount: z.number(),
  type: z.enum(['topup', 'order_debit', 'adjustment']),
  note: z.string().nullable(),
  orderId: z.string().nullable(),
  createdAt: z.string(),
  createdBy: z.string().nullable(),
});

export type LedgerEntryItem = z.infer<typeof ledgerEntryItemSchema>;

export const financeSummaryEmployeeSchema = z.object({
  id: z.string(),
  name: z.string(),
  balance: z.number(),
});

export const financeSummaryResponseSchema = z.object({
  fundBalance: z.number(),
  employees: z.array(financeSummaryEmployeeSchema),
});

export type FinanceSummaryResponse = z.infer<typeof financeSummaryResponseSchema>;

export const fundLedgerDishSchema = z.object({
  name: z.string(),
  quantity: z.number(),
  subtotal: z.number(),
  employees: z.array(z.object({ name: z.string(), quantity: z.number() })),
});

export const fundLedgerItemSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('lunch_day'),
    date: z.string(),
    totalAmount: z.number(),
    orderCount: z.number(),
    dishes: z.array(fundLedgerDishSchema),
  }),
  z.object({
    type: z.literal('topup'),
    date: z.string(),
    amount: z.number(),
    employeeName: z.string(),
    note: z.string().nullable(),
  }),
  z.object({
    type: z.literal('adjustment'),
    date: z.string(),
    amount: z.number(),
    employeeName: z.string(),
    note: z.string().nullable(),
  }),
]);

export const fundLedgerResponseSchema = z.object({
  month: z.string(),
  items: z.array(fundLedgerItemSchema),
});

export type FundLedgerResponse = z.infer<typeof fundLedgerResponseSchema>;
export type FundLedgerItem = z.infer<typeof fundLedgerItemSchema>;
