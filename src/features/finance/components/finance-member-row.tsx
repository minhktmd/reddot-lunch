'use client';

import { Button } from '@/shared/components/atoms/button';
import { cn } from '@/shared/lib/cn';

type FinanceMemberRowProps = {
  employee: {
    id: string;
    name: string;
    balance: number;
  };
  lastTopupDate: string | null;
  onAdjust: () => void;
  onHistory: () => void;
};

export function FinanceMemberRow({ employee, lastTopupDate, onAdjust, onHistory }: FinanceMemberRowProps) {
  const isNegative = employee.balance < 0;
  const displayBalance = `${Math.abs(employee.balance).toLocaleString('vi-VN')}đ`;

  return (
    <tr className="border-border hover:bg-muted/50 border-b transition-colors">
      <td className="text-foreground px-4 py-3 text-sm font-medium">{employee.name}</td>
      <td className={cn('px-4 py-3 text-sm font-medium', isNegative ? 'text-red-600' : 'text-foreground')}>
        {isNegative ? `-${displayBalance}` : displayBalance}
      </td>
      <td className="text-muted-foreground px-4 py-3 text-sm">{lastTopupDate ?? '—'}</td>
      <td className="px-4 py-3 text-right">
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onAdjust}>
            Sửa số dư
          </Button>
          <Button variant="outline" size="sm" onClick={onHistory}>
            Lịch sử
          </Button>
        </div>
      </td>
    </tr>
  );
}
