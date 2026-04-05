'use client';

import { Fragment, useState } from 'react';

import type { MonthlyReportRow } from '../types/report.type';
import { ReportSummaryRow } from './report-summary-row';
import { ReportDetailRow } from './report-detail-row';
import { ReportFooterRow } from './report-footer-row';

type ReportSummaryTableProps = {
  rows: MonthlyReportRow[];
  month: string;
};

export function ReportSummaryTable({ rows, month }: ReportSummaryTableProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = (employeeId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(employeeId)) {
        next.delete(employeeId);
      } else {
        next.add(employeeId);
      }
      return next;
    });
  };

  if (rows.length === 0) {
    return <p className="py-8 text-center text-muted-foreground">Không có dữ liệu cho tháng này</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="px-6 py-3 text-left font-medium">Tên</th>
            <th className="px-6 py-3 text-right font-medium">Số ngày</th>
            <th className="px-6 py-3 text-right font-medium">Số suất</th>
            <th className="px-6 py-3 text-right font-medium">Tổng tiền</th>
            <th className="px-6 py-3 text-right font-medium">Đã trả</th>
            <th className="px-6 py-3 text-right font-medium">Còn nợ</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const isExpanded = expandedIds.has(row.employee.id);
            return (
              <Fragment key={row.employee.id}>
                <ReportSummaryRow row={row} isExpanded={isExpanded} onToggle={() => toggleExpand(row.employee.id)} />
                {isExpanded && <ReportDetailRow employeeId={row.employee.id} month={month} />}
              </Fragment>
            );
          })}
          <ReportFooterRow rows={rows} />
        </tbody>
      </table>
    </div>
  );
}
