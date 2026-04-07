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
      <div className="bg-card overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted text-muted-foreground border-b text-left">
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
                <td className="text-muted-foreground px-4 py-2">{formatDate(order.menuOfDay.date)}</td>
                <td className="text-foreground px-4 py-2">{order.menuOfDayItem.name}</td>
                <td className="text-foreground px-4 py-2">{order.quantity}</td>
                <td className="text-foreground px-4 py-2">{formatPrice(order.menuOfDayItem.price)}</td>
                <td className="text-foreground px-4 py-2 font-medium">
                  {formatPrice(order.menuOfDayItem.price * order.quantity)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-muted flex items-center justify-between rounded-md px-4 py-3">
        <span className="text-foreground font-medium">Tổng cần trả:</span>
        <span className="text-lg font-bold text-blue-600">{formatPrice(total)}</span>
      </div>
    </div>
  );
}
