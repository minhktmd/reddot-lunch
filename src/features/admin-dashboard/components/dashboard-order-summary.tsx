import type { TodayAdminOrder } from '../types/admin-dashboard.type';
import type { EmployeeListItem } from '@/domains/employee';
import { DashboardOrderList } from './dashboard-order-list';
import { DashboardNoOrderList } from './dashboard-no-order-list';

type Props = {
  orders: TodayAdminOrder[];
  notOrdered: EmployeeListItem[];
};

export function DashboardOrderSummary({ orders, notOrdered }: Props) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="mb-3 font-semibold text-gray-800">Đã đặt ({orders.length} đơn)</h2>
        <DashboardOrderList orders={orders} />
      </div>
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="mb-3 font-semibold text-gray-800">Chưa đặt ({notOrdered.length} người)</h2>
        <DashboardNoOrderList employees={notOrdered} />
      </div>
    </div>
  );
}
