'use client';

import { useState } from 'react';

import { cn } from '@/shared/lib/cn';

import { useFinanceSummary } from '../hooks/use-finance-summary';

import { FinanceMemberTable } from './finance-member-table';
import { FinanceSummaryBar } from './finance-summary-bar';
import { FundLedgerTab } from './fund-ledger-tab';

type Tab = 'members' | 'fund-ledger';

export function FinanceAdminPage() {
  const [activeTab, setActiveTab] = useState<Tab>('members');
  const { data: summary, isLoading } = useFinanceSummary();

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-foreground text-2xl font-semibold">Tài chính</h1>
        <p className="text-muted-foreground mt-1 text-sm">Quản lý quỹ ăn trưa và số dư thành viên</p>
      </div>

      <FinanceSummaryBar fundBalance={summary?.fundBalance ?? 0} isLoading={isLoading} />

      <div className="border-border bg-card rounded-lg border">
        <div className="border-border border-b">
          <div className="flex gap-0 px-4">
            {(
              [
                { id: 'members', label: 'Thành viên' },
                { id: 'fund-ledger', label: 'Lịch sử quỹ' },
              ] as { id: Tab; label: string }[]
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'cursor-pointer border-b-2 px-4 py-3 text-sm font-medium transition-colors',
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'text-muted-foreground hover:text-foreground border-transparent'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4">
          {activeTab === 'members' && <FinanceMemberTable employees={summary?.employees ?? []} />}
          {activeTab === 'fund-ledger' && <FundLedgerTab />}
        </div>
      </div>
    </div>
  );
}
