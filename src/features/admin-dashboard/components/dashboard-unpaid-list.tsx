import type { EmployeePayment } from '../types/admin-dashboard.type';
import { formatPrice } from '@/shared/utils/format';

type Props = {
  employees: EmployeePayment[];
};

export function DashboardUnpaidList({ employees }: Props) {
  if (employees.length === 0) {
    return <p className="text-sm text-muted-foreground">Tất cả đã thanh toán.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-muted-foreground">
            <th className="pb-2 font-medium">Tên</th>
            <th className="pb-2 text-right font-medium">Số tiền</th>
          </tr>
        </thead>
        <tbody>
          {employees.map((emp) => (
            <tr key={emp.employeeId} className="border-b border-border last:border-0">
              <td className="py-2 pr-3 font-medium text-foreground">{emp.employeeName}</td>
              <td className="py-2 text-right text-foreground">{formatPrice(emp.totalAmount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
