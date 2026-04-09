'use client';

import { useState } from 'react';

import type { FundLedgerDish } from '@/domains/ledger';

import { FundLedgerLunchDetail } from './fund-ledger-lunch-detail';

type FundLedgerLunchRowProps = {
  date: string;
  totalAmount: number;
  orderCount: number;
  dishes: FundLedgerDish[];
};

function formatDisplayDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

export function FundLedgerLunchRow({ date, totalAmount, orderCount, dishes }: FundLedgerLunchRowProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border-b py-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-xs">{formatDisplayDate(date)}</span>
          <span className="text-sm">🍱 Cơm trưa</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-red-600">
            -{Math.abs(totalAmount).toLocaleString('vi-VN')}đ
          </span>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-primary cursor-pointer text-xs hover:underline"
          >
            {expanded ? '▼ Ẩn' : '▶ Chi tiết'}
          </button>
        </div>
      </div>
      {expanded && <FundLedgerLunchDetail dishes={dishes} orderCount={orderCount} totalAmount={totalAmount} />}
    </div>
  );
}
