'use client';

import { cn } from '@/shared/lib/cn';

import type { LedgerEntryItem } from '../types/finance.type';

type FinanceHistoryListProps = {
  entries: LedgerEntryItem[];
  isLoading: boolean;
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function getLabel(entry: LedgerEntryItem): string {
  if (entry.type === 'topup') return 'Nạp tiền';
  if (entry.type === 'order_debit') return entry.note ? `Đặt cơm · ${entry.note}` : 'Đặt cơm';
  return 'Điều chỉnh số dư';
}

function formatAmount(amount: number): string {
  const abs = Math.abs(amount).toLocaleString('vi-VN');
  return amount >= 0 ? `+${abs}đ` : `-${abs}đ`;
}

export function FinanceHistoryList({ entries, isLoading }: FinanceHistoryListProps) {
  if (isLoading) {
    return <div className="text-muted-foreground py-8 text-center text-sm">Đang tải...</div>;
  }

  if (entries.length === 0) {
    return <div className="text-muted-foreground py-8 text-center text-sm">Chưa có giao dịch nào.</div>;
  }

  return (
    <div className="space-y-1">
      <h3 className="mb-2 text-sm font-medium">Lịch sử giao dịch</h3>
      <div className="divide-y">
        {entries.map((entry) => (
          <div key={entry.id} className="flex items-center justify-between py-2.5">
            <div className="min-w-0 flex-1">
              <p className="text-sm">{getLabel(entry)}</p>
              <p className="text-muted-foreground text-xs">{formatDate(entry.createdAt)}</p>
              {entry.type === 'adjustment' && entry.note && (
                <p className="text-muted-foreground text-xs">({entry.note})</p>
              )}
            </div>
            <span
              className={cn('shrink-0 text-sm font-medium', entry.amount >= 0 ? 'text-green-600' : 'text-red-600')}
            >
              {formatAmount(entry.amount)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
