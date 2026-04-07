'use client';

import { ChevronDown, ChevronRight } from 'lucide-react';

import { formatPrice } from '@/shared/utils/format';

import type { MonthlyReportRow } from '../types/report.type';

type ReportSummaryRowProps = {
  row: MonthlyReportRow;
  isExpanded: boolean;
  onToggle: () => void;
};

export function ReportSummaryRow({ row, isExpanded, onToggle }: ReportSummaryRowProps) {
  return (
    <tr className="hover:bg-muted/50 cursor-pointer border-b" onClick={onToggle}>
      <td className="px-6 py-3">
        <div className="flex items-center gap-2">
          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          {row.employee.name}
        </div>
      </td>
      <td className="px-6 py-3 text-right">{row.daysOrdered}</td>
      <td className="px-6 py-3 text-right">{row.totalPortions}</td>
      <td className="px-6 py-3 text-right">{formatPrice(row.totalAmount)}</td>
      <td className="px-6 py-3 text-right">{formatPrice(row.paidAmount)}</td>
      <td className="px-6 py-3 text-right">{formatPrice(row.unpaidAmount)}</td>
    </tr>
  );
}
