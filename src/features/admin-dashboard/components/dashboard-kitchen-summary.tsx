'use client';

import { toast } from 'sonner';

import type { TodayAdminOrder, MealSummaryItem } from '../types/admin-dashboard.type';
import { Button } from '@/shared/components/atoms/button';
import { formatPrice } from '@/shared/utils/format';

type Props = {
  orders: TodayAdminOrder[];
};

function computeMealSummary(orders: TodayAdminOrder[]): MealSummaryItem[] {
  const map = orders.reduce<Record<string, number>>((acc, order) => {
    const name = order.menuOfDayItem.menuItem.name;
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
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-semibold text-gray-800">Tóm tắt gửi bếp</h2>
        <Button variant="outline" size="sm" onClick={handleCopy}>
          Sao chép
        </Button>
      </div>
      <div className="rounded-md bg-gray-50 p-3 font-mono text-sm">
        <div className="border-b border-gray-300 pb-1 text-gray-500">{'━'.repeat(26)}</div>
        <div className="py-2 space-y-1">
          {summary.length === 0 ? (
            <p className="text-gray-500">Chưa có đơn nào.</p>
          ) : (
            summary.map((item) => (
              <div key={item.name} className="flex justify-between gap-4">
                <span className="text-gray-800">{item.name}</span>
                <span className="shrink-0 text-gray-600">x {item.quantity}</span>
              </div>
            ))
          )}
        </div>
        <div className="border-t border-gray-300 pt-1 font-medium text-gray-800">
          Tổng: {totalCount} suất — {formatPrice(totalAmount)}
        </div>
      </div>
    </div>
  );
}
