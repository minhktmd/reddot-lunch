'use client';

import { Button } from '@/shared/components/atoms/button';
import { formatPrice, formatTime } from '@/shared/utils/format';

import type { EmployeePayment } from '../types/admin-dashboard.type';

type Props = {
  employees: EmployeePayment[];
  onUnpay: (employeeId: string, employeeName: string) => void;
  isUnpaying: boolean;
};

export function DashboardPaidList({ employees, onUnpay, isUnpaying }: Props) {
  if (employees.length === 0) {
    return <p className="text-muted-foreground text-sm">Chưa có ai thanh toán.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-border text-muted-foreground border-b text-left">
            <th className="pb-2 font-medium">Tên</th>
            <th className="pb-2 text-right font-medium">Số tiền</th>
            <th className="pb-2 text-center font-medium">Thời gian</th>
            <th className="pb-2 font-medium" />
          </tr>
        </thead>
        <tbody>
          {employees.map((emp) => (
            <tr key={emp.employeeId} className="border-border border-b last:border-0">
              <td className="text-foreground py-2 pr-3 font-medium">{emp.employeeName}</td>
              <td className="text-foreground py-2 pr-3 text-right">{formatPrice(emp.totalAmount)}</td>
              <td className="text-muted-foreground py-2 pr-3 text-center">
                {emp.paidAt ? formatTime(emp.paidAt) : '—'}
              </td>
              <td className="py-2 text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onUnpay(emp.employeeId, emp.employeeName)}
                  disabled={isUnpaying}
                  className="text-orange-600 hover:text-orange-700"
                >
                  Hoàn tác
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
