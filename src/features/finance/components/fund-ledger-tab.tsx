'use client';

import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useState } from 'react';

import { Button } from '@/shared/components/atoms/button';

import { useFundLedger } from '../hooks/use-fund-ledger';

import { FundLedgerList } from './fund-ledger-list';

function getCurrentMonth(): string {
  return format(new Date(), 'yyyy-MM');
}

function formatMonthLabel(monthStr: string): string {
  const [year, month] = monthStr.split('-').map(Number);
  const d = new Date(year, month - 1, 1);
  return format(d, "'Tháng' M, yyyy", { locale: vi });
}

function shiftMonth(monthStr: string, delta: number): string {
  const [year, month] = monthStr.split('-').map(Number);
  const d = new Date(year, month - 1 + delta, 1);
  return format(d, 'yyyy-MM');
}

export function FundLedgerTab() {
  const [month, setMonth] = useState(getCurrentMonth);
  const { data, isLoading } = useFundLedger(month);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => setMonth((m) => shiftMonth(m, -1))}>
          ◀
        </Button>
        <span className="text-sm font-medium">{formatMonthLabel(month)}</span>
        <Button variant="ghost" size="sm" onClick={() => setMonth((m) => shiftMonth(m, 1))}>
          ▶
        </Button>
      </div>
      <FundLedgerList items={data?.items ?? []} isLoading={isLoading} />
    </div>
  );
}
