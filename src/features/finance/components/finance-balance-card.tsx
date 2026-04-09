'use client';

import { cn } from '@/shared/lib/cn';

type FinanceBalanceCardProps = {
  balance: number;
  isLoading: boolean;
};

export function FinanceBalanceCard({ balance, isLoading }: FinanceBalanceCardProps) {
  const isNegative = balance < 0;
  const displayAmount = `${Math.abs(balance).toLocaleString('vi-VN')}đ`;

  if (isLoading) {
    return (
      <div className="bg-card rounded-lg border p-6 text-center">
        <p className="text-muted-foreground text-sm">Đang tải...</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border p-6 text-center">
      <p className="text-muted-foreground mb-2 text-sm">Số dư của bạn</p>
      <p className={cn('text-3xl font-bold', isNegative ? 'text-red-600' : 'text-green-600')}>
        {isNegative ? `-${displayAmount}` : displayAmount}
      </p>
      {isNegative && (
        <p className="text-muted-foreground mt-3 text-sm">
          Số dư âm nghĩa là bạn đang nợ quỹ ăn trưa.
          <br />
          Vui lòng nạp tiền sớm nhé!
        </p>
      )}
    </div>
  );
}
