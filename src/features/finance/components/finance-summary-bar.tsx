'use client';

import { cn } from '@/shared/lib/cn';

type FinanceSummaryBarProps = {
  fundBalance: number;
  isLoading: boolean;
};

export function FinanceSummaryBar({ fundBalance, isLoading }: FinanceSummaryBarProps) {
  if (isLoading) {
    return (
      <div className="border-border bg-card rounded-lg border p-4">
        <p className="text-muted-foreground text-sm">Đang tải...</p>
      </div>
    );
  }

  const isNegative = fundBalance < 0;
  const displayAmount = `${Math.abs(fundBalance).toLocaleString('vi-VN')}đ`;

  return (
    <div className="border-border bg-card rounded-lg border p-4">
      <h2 className="text-foreground mb-1 font-semibold">Quỹ ăn trưa chung</h2>
      <p className={cn('text-xl font-bold', isNegative ? 'text-red-600' : 'text-green-600')}>
        Tổng số dư: {isNegative ? `-${displayAmount}` : `+${displayAmount}`}
      </p>
      {isNegative && (
        <p className="mt-1 text-sm text-red-600">Quỹ đang thiếu — admin cần bù {displayAmount}</p>
      )}
    </div>
  );
}
