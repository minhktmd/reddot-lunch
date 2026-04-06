import { DashboardOrderList } from './dashboard-order-list';

import type { TodayAdminOrder } from '../types/admin-dashboard.type';

type Props = {
  orders: TodayAdminOrder[];
};

export function DashboardOrderSummary({ orders }: Props) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h2 className="mb-3 font-semibold text-foreground">Đã đặt ({orders.length} đơn)</h2>
      <DashboardOrderList orders={orders} />
    </div>
  );
}
