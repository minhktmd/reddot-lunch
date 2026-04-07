'use client';

import { useState } from 'react';

import { Button } from '@/shared/components/atoms/button';

import { useTodayOrders } from '../hooks/use-today-orders';

export function MenuKitchenSummary() {
  const { data: orders = [], isLoading } = useTodayOrders();
  const [copied, setCopied] = useState(false);

  if (isLoading) {
    return <p className="text-muted-foreground text-sm">Đang tải đơn hàng...</p>;
  }

  // Aggregate by dish name
  const summary = orders.reduce<Record<string, number>>((acc, order) => {
    const name = order.menuOfDayItem.name;
    acc[name] = (acc[name] ?? 0) + order.quantity;
    return acc;
  }, {});

  const entries = Object.entries(summary);
  const total = Object.values(summary).reduce((sum, qty) => sum + qty, 0);

  const summaryText = [
    '━━━━━━━━━━━━━━━━━━━━━━━━━━',
    'Tóm tắt đơn hàng hôm nay',
    '━━━━━━━━━━━━━━━━━━━━━━━━━━',
    ...entries.map(([name, qty]) => `${name.padEnd(20)} x ${qty}`),
    '━━━━━━━━━━━━━━━━━━━━━━━━━━',
    `Tổng: ${total} suất`,
  ].join('\n');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(summaryText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: select text
    }
  };

  return (
    <div className="border-border bg-muted mt-6 rounded-lg border p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-foreground font-semibold">Tóm tắt đơn hàng hôm nay</h3>
        <Button variant="outline" size="sm" onClick={handleCopy}>
          {copied ? 'Đã sao chép!' : 'Sao chép'}
        </Button>
      </div>
      <pre className="text-foreground font-mono text-sm whitespace-pre-wrap">{summaryText}</pre>
    </div>
  );
}
