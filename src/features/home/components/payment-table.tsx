'use client';

import { formatPrice, formatDate } from '@/shared/utils/format';

import type { UnpaidOrderItem } from '../types/order.type';

type PaymentTableProps = {
  orders: UnpaidOrderItem[];
};

export function PaymentTable({ orders }: PaymentTableProps) {
  const total = orders.reduce((sum, o) => sum + o.menuOfDayItem.price * o.quantity, 0);

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted text-left text-muted-foreground">
              <th className="px-4 py-2 font-medium">Ngày</th>
              <th className="px-4 py-2 font-medium">Món</th>
              <th className="px-4 py-2 font-medium">SL</th>
              <th className="px-4 py-2 font-medium">Đơn giá</th>
              <th className="px-4 py-2 font-medium">Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-b last:border-0">
                <td className="px-4 py-2 text-muted-foreground">{formatDate(order.menuOfDay.date)}</td>
                <td className="px-4 py-2 text-foreground">{order.menuOfDayItem.name}</td>
                <td className="px-4 py-2 text-foreground">{order.quantity}</td>
                <td className="px-4 py-2 text-foreground">{formatPrice(order.menuOfDayItem.price)}</td>
                <td className="px-4 py-2 font-medium text-foreground">
                  {formatPrice(order.menuOfDayItem.price * order.quantity)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between rounded-md bg-muted px-4 py-3">
        <span className="font-medium text-foreground">Tổng cần trả:</span>
        <span className="text-lg font-bold text-blue-600">{formatPrice(total)}</span>
      </div>
    </div>
  );
}
