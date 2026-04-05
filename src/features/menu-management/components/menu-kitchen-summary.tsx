'use client'

import { useState } from 'react'

import { Button } from '@/shared/components/atoms/button'

import { useTodayOrders } from '../hooks/use-today-orders'

export function MenuKitchenSummary() {
  const { data: orders = [], isLoading } = useTodayOrders()
  const [copied, setCopied] = useState(false)

  if (isLoading) {
    return <p className="text-sm text-gray-400">Đang tải đơn hàng...</p>
  }

  // Aggregate by dish name
  const summary = orders.reduce<Record<string, number>>((acc, order) => {
    const name = order.menuOfDayItem.menuItem.name
    acc[name] = (acc[name] ?? 0) + order.quantity
    return acc
  }, {})

  const entries = Object.entries(summary)
  const total = Object.values(summary).reduce((sum, qty) => sum + qty, 0)

  const summaryText = [
    '━━━━━━━━━━━━━━━━━━━━━━━━━━',
    'Tóm tắt đơn hàng hôm nay',
    '━━━━━━━━━━━━━━━━━━━━━━━━━━',
    ...entries.map(([name, qty]) => `${name.padEnd(20)} x ${qty}`),
    '━━━━━━━━━━━━━━━━━━━━━━━━━━',
    `Tổng: ${total} suất`,
  ].join('\n')

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(summaryText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback: select text
    }
  }

  return (
    <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold text-gray-800">Tóm tắt đơn hàng hôm nay</h3>
        <Button variant="outline" size="sm" onClick={handleCopy}>
          {copied ? 'Đã sao chép!' : 'Sao chép'}
        </Button>
      </div>
      <pre className="whitespace-pre-wrap font-mono text-sm text-gray-700">{summaryText}</pre>
    </div>
  )
}
