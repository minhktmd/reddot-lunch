'use client';

import { useState } from 'react';

import { useHomeStore } from '@/features/home';

import { useMyLedger } from '../hooks/use-my-ledger';
import type { FinanceSummaryResponse } from '../types/finance.type';

import { FinanceAdjustSheet } from './finance-adjust-sheet';
import { FinanceHistorySheet } from './finance-history-sheet';
import { FinanceMemberRow } from './finance-member-row';

type FinanceMemberTableProps = {
  employees: FinanceSummaryResponse['employees'];
};

type SheetState =
  | { type: 'none' }
  | { type: 'adjust'; employeeId: string; employeeName: string; balance: number }
  | { type: 'history'; employeeId: string; employeeName: string };

export function FinanceMemberTable({ employees }: FinanceMemberTableProps) {
  const [sheet, setSheet] = useState<SheetState>({ type: 'none' });
  const adminId = useHomeStore((s) => s.selectedEmployeeId) ?? '';

  // Sort: negative balance first (most urgent), then by name asc
  const sorted = [...employees].sort((a, b) => {
    if (a.balance < 0 && b.balance >= 0) return -1;
    if (a.balance >= 0 && b.balance < 0) return 1;
    return a.name.localeCompare(b.name, 'vi');
  });

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-border text-muted-foreground border-b text-xs font-medium tracking-wide uppercase">
              <th className="px-4 py-3">Tên</th>
              <th className="px-4 py-3">Số dư</th>
              <th className="px-4 py-3">Lần nạp gần nhất</th>
              <th className="px-4 py-3 text-right" />
            </tr>
          </thead>
          <tbody>
            {sorted.map((emp) => (
              <MemberRowWithTopup
                key={emp.id}
                employee={emp}
                onAdjust={() =>
                  setSheet({ type: 'adjust', employeeId: emp.id, employeeName: emp.name, balance: emp.balance })
                }
                onHistory={() => setSheet({ type: 'history', employeeId: emp.id, employeeName: emp.name })}
              />
            ))}
          </tbody>
        </table>
      </div>

      {sheet.type === 'adjust' && (
        <FinanceAdjustSheet
          open
          onOpenChange={(open) => !open && setSheet({ type: 'none' })}
          employeeId={sheet.employeeId}
          employeeName={sheet.employeeName}
          currentBalance={sheet.balance}
          adminEmployeeId={adminId}
        />
      )}
      {sheet.type === 'history' && (
        <FinanceHistorySheet
          open
          onOpenChange={(open) => !open && setSheet({ type: 'none' })}
          employeeId={sheet.employeeId}
          employeeName={sheet.employeeName}
        />
      )}
    </>
  );
}

function MemberRowWithTopup({
  employee,
  onAdjust,
  onHistory,
}: {
  employee: FinanceSummaryResponse['employees'][number];
  onAdjust: () => void;
  onHistory: () => void;
}) {
  const { data: entries = [] } = useMyLedger(employee.id);
  const lastTopup = entries.find((e) => e.type === 'topup');
  const lastTopupDate = lastTopup
    ? new Date(lastTopup.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : null;

  return (
    <FinanceMemberRow employee={employee} lastTopupDate={lastTopupDate} onAdjust={onAdjust} onHistory={onHistory} />
  );
}
