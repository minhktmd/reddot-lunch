'use client';

import { useState } from 'react';

import { cn } from '@/shared/lib/cn';

import { OrderTab } from './order-tab';
import { PaymentTab } from './payment-tab';

type Tab = 'order' | 'payment';

type HomeTabsProps = {
  employeeId: string;
};

export function HomeTabs({ employeeId }: HomeTabsProps) {
  const [activeTab, setActiveTab] = useState<Tab>('order');

  return (
    <div>
      <div className="border-b bg-white">
        <div className="mx-auto max-w-2xl px-4">
          <div className="flex gap-0">
            {(
              [
                { id: 'order', label: 'Đặt cơm' },
                { id: 'payment', label: 'Thanh toán' },
              ] as { id: Tab; label: string }[]
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'cursor-pointer border-b-2 px-4 py-3 text-sm font-medium transition-colors',
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-4">
        {activeTab === 'order' && <OrderTab employeeId={employeeId} />}
        {activeTab === 'payment' && <PaymentTab employeeId={employeeId} />}
      </div>
    </div>
  );
}
