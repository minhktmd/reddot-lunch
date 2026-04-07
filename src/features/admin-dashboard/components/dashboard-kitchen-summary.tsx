'use client';

import { toast } from 'sonner';

import { Button } from '@/shared/components/atoms/button';
import { formatPrice } from '@/shared/utils/format';

import type { TodayAdminOrder, MealSummaryItem } from '../types/admin-dashboard.type';

type Props = {
  orders: TodayAdminOrder[];
};

function computeMealSummary(orders: TodayAdminOrder[]): MealSummaryItem[] {
  const map = orders.reduce<Record<string, number>>((acc, order) => {
    const name = order.menuOfDayItem.name;
    acc[name] = (acc[name] ?? 0) + order.quantity;
    return acc;
  }, {});
  return Object.entries(map).map(([name, quantity]) => ({ name, quantity }));
}

function buildKitchenText(summary: MealSummaryItem[], totalCount: number, totalAmount: number): string {
  const lines = [
    '━━━━━━━━━━━━━━━━━━━━━━━━━━',
    'Tóm tắt gửi bếp',
    '━━━━━━━━━━━━━━━━━━━━━━━━━━',
    ...summary.map((item) => `${item.name.padEnd(20)} x ${item.quantity}`),
    '━━━━━━━━━━━━━━━━━━━━━━━━━━',
    `Tổng: ${totalCount} suất — ${totalAmount.toLocaleString('vi-VN')}đ`,
  ];
  return lines.join('\n');
}

export function DashboardKitchenSummary({ orders }: Props) {
  const summary = computeMealSummary(orders);
  const totalCount = orders.reduce((sum, o) => sum + o.quantity, 0);
  const totalAmount = orders.reduce((sum, o) => sum + o.quantity * o.menuOfDayItem.price, 0);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(buildKitchenText(summary, totalCount, totalAmount));
      toast.success('Đã sao chép');
    } catch {
      toast.error('Không thể sao chép');
    }
  };

  return (
    <div className="border-border bg-card rounded-lg border p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-foreground font-semibold">Tóm tắt gửi bếp</h2>
        <Button variant="outline" size="sm" onClick={handleCopy}>
          Sao chép
        </Button>
      </div>
      <div className="bg-muted rounded-md p-3 font-mono text-sm">
        <div className="border-border text-muted-foreground border-b pb-1">{'━'.repeat(26)}</div>
        <div className="space-y-1 py-2">
          {summary.length === 0 ? (
            <p className="text-muted-foreground">Chưa có đơn nào.</p>
          ) : (
            summary.map((item) => (
              <div key={item.name} className="flex justify-between gap-4">
                <span className="text-foreground">{item.name}</span>
                <span className="text-muted-foreground shrink-0">x {item.quantity}</span>
              </div>
            ))
          )}
        </div>
        <div className="border-border text-foreground border-t pt-1 font-medium">
          Tổng: {totalCount} suất — {formatPrice(totalAmount)}
        </div>
      </div>
    </div>
  );
}
