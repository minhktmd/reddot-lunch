'use client';

import type { EmployeePayment } from '../types/admin-dashboard.type';
import { DashboardPaidList } from './dashboard-paid-list';
import { DashboardUnpaidList } from './dashboard-unpaid-list';
import { useUnpayOrders } from '../hooks/use-unpay-orders';
import { getTodayVNDateString } from '@/shared/utils/format';

type Props = {
  paidEmployees: EmployeePayment[];
  unpaidEmployees: EmployeePayment[];
};

export function DashboardPaymentStatus({ paidEmployees, unpaidEmployees }: Props) {
  const { mutate: unpay, isPending } = useUnpayOrders();

  const handleUnpay = (employeeId: string, employeeName: string) => {
    if (!window.confirm(`Hoàn tác thanh toán của ${employeeName}?`)) return;
    const date = getTodayVNDateString();
    unpay({ employeeId, date });
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="mb-3 font-semibold text-gray-800">Đã trả ({paidEmployees.length} người)</h2>
        <DashboardPaidList employees={paidEmployees} onUnpay={handleUnpay} isUnpaying={isPending} />
      </div>
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="mb-3 font-semibold text-gray-800">Chưa trả ({unpaidEmployees.length} người)</h2>
        <DashboardUnpaidList employees={unpaidEmployees} />
      </div>
    </div>
  );
}
