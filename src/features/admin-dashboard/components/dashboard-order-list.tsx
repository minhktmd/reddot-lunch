import { formatPrice } from '@/shared/utils/format';

import type { TodayAdminOrder } from '../types/admin-dashboard.type';

type Props = {
  orders: TodayAdminOrder[];
  totalOrderedAmount: number;
};

export function DashboardOrderList({ orders, totalOrderedAmount }: Props) {
  if (orders.length === 0) {
    return <p className="text-muted-foreground text-sm">Chưa có ai đặt món.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-border text-muted-foreground border-b text-left">
            <th className="pb-2 font-medium">Tên</th>
            <th className="pb-2 font-medium">Món</th>
            <th className="pb-2 text-center font-medium">SL</th>
            <th className="pb-2 text-right font-medium">Tiền</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id} className="border-border border-b last:border-0">
              <td className="text-foreground py-2 pr-3 font-medium">{order.employee.name}</td>
              <td className="text-muted-foreground py-2 pr-3">{order.menuOfDayItem.name}</td>
              <td className="text-muted-foreground py-2 pr-3 text-center">{order.quantity}</td>
              <td className="text-foreground py-2 text-right">
                {formatPrice(order.quantity * order.menuOfDayItem.price)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-border border-t">
            <td className="pt-2" />
            <td className="pt-2" />
            <td className="pt-2" />
            <td className="text-foreground pt-2 text-right font-bold">{formatPrice(totalOrderedAmount)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
