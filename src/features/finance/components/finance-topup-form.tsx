'use client';

import { useState } from 'react';

import { Button } from '@/shared/components/atoms/button';
import { Input } from '@/shared/components/atoms/input';
import { useDebounce } from '@/shared/hooks/use-debounce';

import type { AppConfigResponse } from '@/features/app-settings';

import { FinanceQRDisplay } from './finance-qr-display';

type FinanceTopupFormProps = {
  config: AppConfigResponse | null;
  employeeName: string;
  onTopup: (amount: number) => void;
  isLoading: boolean;
};

export function FinanceTopupForm({ config, employeeName, onTopup, isLoading }: FinanceTopupFormProps) {
  const [amount, setAmount] = useState('');

  const parsedAmount = parseInt(amount.replace(/\D/g, ''), 10) || 0;
  const debouncedAmount = useDebounce(parsedAmount, 400);
  const isValid = parsedAmount >= 1000;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    onTopup(parsedAmount);
    setAmount('');
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium">Nạp tiền vào quỹ</h3>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="text-muted-foreground mb-1 block text-sm">Số tiền muốn nạp:</label>
          <div className="flex items-center gap-2">
            <Input
              type="text"
              inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="50000"
            />
            <span className="text-muted-foreground text-sm">đ</span>
          </div>
        </div>

        {config && (
          <FinanceQRDisplay config={config} amount={debouncedAmount} employeeName={employeeName} />
        )}

        <Button type="submit" disabled={!isValid || isLoading} className="w-full">
          {isLoading ? 'Đang xử lý...' : 'Xác nhận đã chuyển khoản'}
        </Button>
      </form>
    </div>
  );
}
