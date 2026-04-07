import { formatPrice } from '@/shared/utils/format';

import type { EmployeePayment } from '../types/admin-dashboard.type';

type Props = {
  employees: EmployeePayment[];
};

export function DashboardUnpaidList({ employees }: Props) {
  if (employees.length === 0) {
    return <p className="text-muted-foreground text-sm">Tất cả đã thanh toán.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-border text-muted-foreground border-b text-left">
            <th className="pb-2 font-medium">Tên</th>
            <th className="pb-2 text-right font-medium">Số tiền</th>
          </tr>
        </thead>
        <tbody>
          {employees.map((emp) => (
            <tr key={emp.employeeId} className="border-border border-b last:border-0">
              <td className="text-foreground py-2 pr-3 font-medium">{emp.employeeName}</td>
              <td className="text-foreground py-2 text-right">{formatPrice(emp.totalAmount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
