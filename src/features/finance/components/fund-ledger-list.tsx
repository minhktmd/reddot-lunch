'use client';

import type { FundLedgerItem } from '../types/finance.type';

import { FundLedgerEntryRow } from './fund-ledger-entry-row';
import { FundLedgerLunchRow } from './fund-ledger-lunch-row';

type FundLedgerListProps = {
  items: FundLedgerItem[];
  isLoading: boolean;
};

export function FundLedgerList({ items, isLoading }: FundLedgerListProps) {
  if (isLoading) {
    return <div className="text-muted-foreground py-8 text-center text-sm">Đang tải...</div>;
  }

  if (items.length === 0) {
    return <div className="text-muted-foreground py-8 text-center text-sm">Không có dữ liệu trong tháng này.</div>;
  }

  return (
    <div>
      {items.map((item, idx) => {
        if (item.type === 'lunch_day') {
          return (
            <FundLedgerLunchRow
              key={`lunch-${item.date}-${idx}`}
              date={item.date}
              totalAmount={item.totalAmount}
              orderCount={item.orderCount}
              dishes={item.dishes}
            />
          );
        }
        return (
          <FundLedgerEntryRow
            key={`entry-${item.date}-${idx}`}
            type={item.type}
            date={item.date}
            amount={item.amount}
            employeeName={item.employeeName}
            note={item.note}
          />
        );
      })}
    </div>
  );
}
