import { DashboardOrderList } from './dashboard-order-list';

import type { TodayAdminOrder } from '../types/admin-dashboard.type';

type Props = {
  orders: TodayAdminOrder[];
};

export function DashboardOrderSummary({ orders }: Props) {
  const totalOrderedAmount = orders.reduce((sum, o) => sum + o.quantity * o.menuOfDayItem.price, 0);

  return (
    <div className="border-border bg-card rounded-lg border p-4">
      <h2 className="text-foreground mb-3 font-semibold">Đã đặt ({orders.length} đơn)</h2>
      <DashboardOrderList orders={orders} totalOrderedAmount={totalOrderedAmount} />
    </div>
  );
}
