'use client';

import { useState } from 'react';

import { FinanceTab } from '@/features/finance';
import { useMyBalance } from '@/features/finance/hooks/use-my-balance';
import { cn } from '@/shared/lib/cn';

import { OrderTab } from './order-tab';

type Tab = 'order' | 'finance';

type HomeTabsProps = {
  employeeId: string;
};

export function HomeTabs({ employeeId }: HomeTabsProps) {
  const [activeTab, setActiveTab] = useState<Tab>('order');
  const { data: balanceData, isLoading: balanceLoading } = useMyBalance(employeeId);

  const balance = balanceData?.balance ?? 0;
  const balanceSuffix = balanceLoading
    ? ''
    : balance >= 0
      ? ` · ${balance.toLocaleString('vi-VN')}đ`
      : ` · -${Math.abs(balance).toLocaleString('vi-VN')}đ`;

  return (
    <div>
      <div className="bg-card border-b">
        <div className="mx-auto max-w-2xl px-4">
          <div className="flex gap-0">
            <button
              onClick={() => setActiveTab('order')}
              className={cn(
                'cursor-pointer border-b-2 px-4 py-3 text-sm font-medium transition-colors',
                activeTab === 'order'
                  ? 'border-blue-600 text-blue-600'
                  : 'text-muted-foreground hover:text-foreground border-transparent'
              )}
            >
              Đặt cơm
            </button>
            <button
              onClick={() => setActiveTab('finance')}
              className={cn(
                'cursor-pointer border-b-2 px-4 py-3 text-sm font-medium transition-colors',
                activeTab === 'finance'
                  ? 'border-blue-600 text-blue-600'
                  : 'text-muted-foreground hover:text-foreground border-transparent',
                !balanceLoading && balance < 0 && 'text-red-600'
              )}
            >
              Tài chính{balanceSuffix}
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-4">
        {activeTab === 'order' && <OrderTab employeeId={employeeId} />}
        {activeTab === 'finance' && <FinanceTab employeeId={employeeId} />}
      </div>
    </div>
  );
}
