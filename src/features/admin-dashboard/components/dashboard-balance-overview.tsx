'use client';

import Link from 'next/link';

import { useFinanceSummary } from '@/features/finance';
import { cn } from '@/shared/lib/cn';

export function DashboardBalanceOverview() {
  const { data: summary, isLoading } = useFinanceSummary();

  if (isLoading) {
    return (
      <div className="bg-card rounded-lg border p-4">
        <p className="text-muted-foreground text-sm">Đang tải...</p>
      </div>
    );
  }

  const fundBalance = summary?.fundBalance ?? 0;
  const inDebt = (summary?.employees ?? []).filter((e) => e.balance < 0);

  return (
    <div className="bg-card rounded-lg border p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium">Số dư thành viên</h3>
        <Link href="/admin/finance" className="text-primary text-xs hover:underline">
          Xem chi tiết
        </Link>
      </div>

      <p className={cn('text-lg font-bold', fundBalance < 0 ? 'text-red-600' : 'text-green-600')}>
        Quỹ chung: {fundBalance >= 0 ? '+' : '-'}
        {Math.abs(fundBalance).toLocaleString('vi-VN')}đ
      </p>

      {inDebt.length > 0 && (
        <div className="mt-3">
          <p className="text-muted-foreground mb-1 text-sm">
            Đang nợ ({inDebt.length} người):
          </p>
          <ul className="space-y-0.5">
            {inDebt
              .sort((a, b) => a.balance - b.balance)
              .map((emp) => (
                <li key={emp.id} className="text-sm">
                  <span className="text-muted-foreground">•</span> {emp.name}{' '}
                  <span className="text-red-600">— -{Math.abs(emp.balance).toLocaleString('vi-VN')}đ</span>
                </li>
              ))}
          </ul>
        </div>
      )}

      {inDebt.length === 0 && (
        <p className="text-muted-foreground mt-2 text-sm">Không ai đang nợ.</p>
      )}
    </div>
  );
}
