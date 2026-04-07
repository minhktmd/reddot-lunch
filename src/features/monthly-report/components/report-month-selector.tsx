'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '@/shared/components/atoms/button';

type ReportMonthSelectorProps = {
  month: string; // "YYYY-MM"
  onMonthChange: (month: string) => void;
};

function formatMonthLabel(month: string): string {
  const [year, m] = month.split('-').map(Number);
  return `Tháng ${m}, ${year}`;
}

function shiftMonth(month: string, delta: number): string {
  const [year, m] = month.split('-').map(Number);
  const date = new Date(year, m - 1 + delta, 1);
  const y = date.getFullYear();
  const mo = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${mo}`;
}

export function ReportMonthSelector({ month, onMonthChange }: ReportMonthSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => onMonthChange(shiftMonth(month, -1))}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="min-w-40 text-center text-lg font-semibold">{formatMonthLabel(month)}</span>
      <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => onMonthChange(shiftMonth(month, 1))}>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
