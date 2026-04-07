'use client';

import { useState } from 'react';

import { getTodayVNDateString, formatPrice } from '@/shared/utils/format';

import { useUnpayOrders } from '../hooks/use-unpay-orders';

import { DashboardPaidList } from './dashboard-paid-list';
import { DashboardUnpaidList } from './dashboard-unpaid-list';
import { UnpayConfirmDialog } from './unpay-confirm-dialog';

import type { EmployeePayment } from '../types/admin-dashboard.type';



type Props = {
  paidEmployees: EmployeePayment[];
  unpaidEmployees: EmployeePayment[];
};

type UnpayTarget = {
  employeeId: string;
  employeeName: string;
  totalAmount: number;
};

export function DashboardPaymentStatus({ paidEmployees, unpaidEmployees }: Props) {
  const { mutate: unpay, isPending } = useUnpayOrders();
  const [unpayTarget, setUnpayTarget] = useState<UnpayTarget | null>(null);

  const handleUnpayClick = (employeeId: string, employeeName: string) => {
    const employee = paidEmployees.find((e) => e.employeeId === employeeId);
    setUnpayTarget({
      employeeId,
      employeeName,
      totalAmount: employee?.totalAmount ?? 0,
    });
  };

  const handleConfirm = () => {
    if (!unpayTarget) return;
    const date = getTodayVNDateString();
    unpay({ employeeId: unpayTarget.employeeId, date });
    setUnpayTarget(null);
  };

  const handleCancel = () => {
    setUnpayTarget(null);
  };

  const totalPaidAmount = paidEmployees.reduce((sum, e) => sum + e.totalAmount, 0);
  const totalUnpaidAmount = unpaidEmployees.reduce((sum, e) => sum + e.totalAmount, 0);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="rounded-lg border border-border bg-card p-4">
        <h2 className="mb-3 font-semibold text-foreground">
          Đã trả ({paidEmployees.length} người) — {formatPrice(totalPaidAmount)}
        </h2>
        <DashboardPaidList employees={paidEmployees} onUnpay={handleUnpayClick} isUnpaying={isPending} />
      </div>
      <div className="rounded-lg border border-border bg-card p-4">
        <h2 className="mb-3 font-semibold text-foreground">
          Chưa trả ({unpaidEmployees.length} người) — Còn nợ: {formatPrice(totalUnpaidAmount)}
        </h2>
        <DashboardUnpaidList employees={unpaidEmployees} />
      </div>
      <UnpayConfirmDialog
        open={unpayTarget !== null}
        employeeName={unpayTarget?.employeeName ?? ''}
        amount={formatPrice(unpayTarget?.totalAmount ?? 0)}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </div>
  );
}
