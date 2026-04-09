'use client';

import { cn } from '@/shared/lib/cn';

type FundLedgerEntryRowProps = {
  type: 'topup' | 'adjustment';
  date: string;
  amount: number;
  employeeName: string;
  note: string | null;
};

function formatDisplayDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

export function FundLedgerEntryRow({ type, date, amount, employeeName, note }: FundLedgerEntryRowProps) {
  const label = type === 'topup' ? `${employeeName} nạp` : `Điều chỉnh: ${employeeName}`;
  const isPositive = amount >= 0;
  const displayAmount = `${isPositive ? '+' : '-'}${Math.abs(amount).toLocaleString('vi-VN')}đ`;

  return (
    <div className="flex items-center justify-between border-b py-2.5">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-xs">{formatDisplayDate(date)}</span>
          <span className="text-sm">{label}</span>
        </div>
        {type === 'adjustment' && note && <p className="text-muted-foreground text-xs">({note})</p>}
      </div>
      <span className={cn('shrink-0 text-sm font-medium', isPositive ? 'text-green-600' : 'text-red-600')}>
        {displayAmount}
      </span>
    </div>
  );
}
