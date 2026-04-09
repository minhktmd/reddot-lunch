'use client';

import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/shared/components/atoms/sheet';

import { useMyLedger } from '../hooks/use-my-ledger';

import { FinanceHistoryList } from './finance-history-list';

type FinanceHistorySheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeId: string;
  employeeName: string;
};

export function FinanceHistorySheet({ open, onOpenChange, employeeId, employeeName }: FinanceHistorySheetProps) {
  const { data: entries = [], isLoading } = useMyLedger(employeeId);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Lịch sử — {employeeName}</SheetTitle>
        </SheetHeader>
        <div className="px-4">
          <FinanceHistoryList entries={entries} isLoading={isLoading} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
