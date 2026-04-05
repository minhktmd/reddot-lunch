'use client';

import { useState } from 'react';

import { getTodayVNDateString } from '@/shared/utils/format';
import { useMonthlyReport } from '../hooks/use-monthly-report';
import { ReportMonthSelector } from './report-month-selector';
import { ReportSummaryTable } from './report-summary-table';
import { ReportExportButton } from './report-export-button';

function getCurrentMonth(): string {
  const today = getTodayVNDateString(); // "YYYY-MM-DD"
  return today.slice(0, 7); // "YYYY-MM"
}

export function MonthlyReportPage() {
  const [month, setMonth] = useState(getCurrentMonth);
  const { data, isLoading } = useMonthlyReport(month);

  const rows = data?.rows ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Báo cáo tháng</h1>
        <ReportExportButton rows={rows} month={month} />
      </div>

      <div className="flex justify-center">
        <ReportMonthSelector month={month} onMonthChange={setMonth} />
      </div>

      {isLoading ? (
        <p className="py-8 text-center text-muted-foreground">Đang tải...</p>
      ) : (
        <ReportSummaryTable rows={rows} month={month} />
      )}
    </div>
  );
}
