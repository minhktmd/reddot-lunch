import type { EmployeePayment } from '../types/admin-dashboard.type';
import { formatPrice } from '@/shared/utils/format';

type Props = {
  employees: EmployeePayment[];
};

export function DashboardUnpaidList({ employees }: Props) {
  if (employees.length === 0) {
    return <p className="text-sm text-gray-500">Tất cả đã thanh toán.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-left text-gray-500">
            <th className="pb-2 font-medium">Tên</th>
            <th className="pb-2 text-right font-medium">Số tiền</th>
          </tr>
        </thead>
        <tbody>
          {employees.map((emp) => (
            <tr key={emp.employeeId} className="border-b border-gray-100 last:border-0">
              <td className="py-2 pr-3 font-medium text-gray-800">{emp.employeeName}</td>
              <td className="py-2 text-right text-gray-700">{formatPrice(emp.totalAmount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
