export const LEDGER_ENTRY_TYPE = {
  TOPUP: 'topup',
  ORDER_DEBIT: 'order_debit',
  ADJUSTMENT: 'adjustment',
} as const;

export type LedgerEntryType = (typeof LEDGER_ENTRY_TYPE)[keyof typeof LEDGER_ENTRY_TYPE];

export type LedgerEntryItem = {
  id: string;
  amount: number;
  type: LedgerEntryType;
  note: string | null;
  orderId: string | null;
  createdAt: string;
  createdBy: string | null;
};

export type BalanceResponse = {
  employeeId: string;
  balance: number;
};

export type FinanceSummaryResponse = {
  fundBalance: number;
  employees: {
    id: string;
    name: string;
    balance: number;
  }[];
};

export type FundLedgerDish = {
  name: string;
  quantity: number;
  subtotal: number;
};

export type FundLedgerItem =
  | {
      type: 'lunch_day';
      date: string;
      totalAmount: number;
      orderCount: number;
      dishes: FundLedgerDish[];
    }
  | {
      type: 'topup' | 'adjustment';
      date: string;
      amount: number;
      employeeName: string;
      note: string | null;
    };

export type FundLedgerResponse = {
  month: string;
  items: FundLedgerItem[];
};
