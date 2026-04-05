'use client';

import { formatDate, formatPrice } from '@/shared/utils/format';
import { useEmployeeReport } from '../hooks/use-employee-report';

type ReportDetailRowProps = {
  employeeId: string;
  month: string;
};

export function ReportDetailRow({ employeeId, month }: ReportDetailRowProps) {
  const { data, isLoading } = useEmployeeReport(employeeId, month, true);

  if (isLoading) {
    return (
      <tr>
        <td colSpan={7} className="bg-muted/50 px-6 py-4 text-center text-sm text-muted-foreground">
          Đang tải...
        </td>
      </tr>
    );
  }

  if (!data || data.orders.length === 0) {
    return (
      <tr>
        <td colSpan={7} className="bg-muted/50 px-6 py-4 text-center text-sm text-muted-foreground">
          Không có dữ liệu
        </td>
      </tr>
    );
  }

  return (
    <>
      {data.orders.map((order, idx) => (
        <tr key={`${order.date}-${order.menuItemName}-${idx}`} className="bg-muted/50 text-sm">
          <td className="px-6 py-2" />
          <td className="px-6 py-2">{formatDate(order.date)}</td>
          <td className="px-6 py-2">{order.menuItemName}</td>
          <td className="px-6 py-2 text-right">{order.quantity}</td>
          <td className="px-6 py-2 text-right">{formatPrice(order.unitPrice)}</td>
          <td className="px-6 py-2 text-right">{formatPrice(order.subtotal)}</td>
          <td className="px-6 py-2 text-center">
            <span
              className={order.isPaid ? 'text-green-600' : 'text-red-600'}
            >
              {order.isPaid ? 'Đã trả' : 'Chưa trả'}
            </span>
          </td>
        </tr>
      ))}
    </>
  );
}
