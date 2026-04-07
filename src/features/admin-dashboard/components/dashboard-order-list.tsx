import { formatPrice } from '@/shared/utils/format';

import type { TodayAdminOrder } from '../types/admin-dashboard.type';

type Props = {
  orders: TodayAdminOrder[];
  totalOrderedAmount: number;
};

export function DashboardOrderList({ orders, totalOrderedAmount }: Props) {
  if (orders.length === 0) {
    return <p className="text-sm text-muted-foreground">Chưa có ai đặt món.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-muted-foreground">
            <th className="pb-2 font-medium">Tên</th>
            <th className="pb-2 font-medium">Món</th>
            <th className="pb-2 text-center font-medium">SL</th>
            <th className="pb-2 text-right font-medium">Tiền</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id} className="border-b border-border last:border-0">
              <td className="py-2 pr-3 font-medium text-foreground">{order.employee.name}</td>
              <td className="py-2 pr-3 text-muted-foreground">{order.menuOfDayItem.name}</td>
              <td className="py-2 pr-3 text-center text-muted-foreground">{order.quantity}</td>
              <td className="py-2 text-right text-foreground">
                {formatPrice(order.quantity * order.menuOfDayItem.price)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t border-border">
            <td className="pt-2" />
            <td className="pt-2" />
            <td className="pt-2" />
            <td className="pt-2 text-right font-bold text-foreground">{formatPrice(totalOrderedAmount)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
