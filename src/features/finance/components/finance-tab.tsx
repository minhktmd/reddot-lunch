'use client';

import { useAppConfig } from '@/features/app-settings';
import { useEmployees } from '@/domains/employee';

import { useMyBalance } from '../hooks/use-my-balance';
import { useMyLedger } from '../hooks/use-my-ledger';
import { useTopup } from '../hooks/use-topup';

import { FinanceBalanceCard } from './finance-balance-card';
import { FinanceHistoryList } from './finance-history-list';
import { FinanceTopupForm } from './finance-topup-form';

type FinanceTabProps = {
  employeeId: string;
};

export function FinanceTab({ employeeId }: FinanceTabProps) {
  const { data: balanceData, isLoading: balanceLoading } = useMyBalance(employeeId);
  const { data: entries = [], isLoading: ledgerLoading } = useMyLedger(employeeId);
  const { data: appConfig } = useAppConfig();
  const { data: employees } = useEmployees();
  const topupMutation = useTopup(employeeId);

  const employeeName = employees?.find((e) => e.id === employeeId)?.name ?? '';

  return (
    <div className="space-y-6">
      <FinanceBalanceCard balance={balanceData?.balance ?? 0} isLoading={balanceLoading} />
      <FinanceTopupForm
        config={appConfig ?? null}
        employeeName={employeeName}
        onTopup={(amount) => topupMutation.mutate(amount)}
        isLoading={topupMutation.isPending}
      />
      <FinanceHistoryList entries={entries} isLoading={ledgerLoading} />
    </div>
  );
}
