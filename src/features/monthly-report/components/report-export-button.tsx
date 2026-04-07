'use client';

import { Download } from 'lucide-react';

import { Button } from '@/shared/components/atoms/button';

import type { MonthlyReportRow } from '../types/report.type';

type ReportExportButtonProps = {
  rows: MonthlyReportRow[];
  month: string; // "YYYY-MM"
};

function buildCsv(rows: MonthlyReportRow[]): string {
  const header = 'Tên,Số ngày,Số suất,Tổng tiền,Đã trả,Còn nợ';
  const lines = rows.map(
    (r) => `${r.employee.name},${r.daysOrdered},${r.totalPortions},${r.totalAmount},${r.paidAmount},${r.unpaidAmount}`
  );
  return '\uFEFF' + [header, ...lines].join('\n');
}

export function ReportExportButton({ rows, month }: ReportExportButtonProps) {
  const handleExport = () => {
    const csv = buildCsv(rows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const [year, m] = month.split('-');
    const filename = `bao-cao-thang-${m}-${year}.csv`;

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Button variant="outline" onClick={handleExport} disabled={rows.length === 0}>
      <Download className="mr-2 h-4 w-4" />
      Xuất CSV
    </Button>
  );
}
