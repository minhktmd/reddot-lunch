'use client';

import Image from 'next/image';
import { useState } from 'react';

import { Button } from '@/shared/components/atoms/button';
import { Input } from '@/shared/components/atoms/input';

type FinanceTopupFormProps = {
  qrCodeUrl: string | null;
  onTopup: (amount: number) => void;
  isLoading: boolean;
};

export function FinanceTopupForm({ qrCodeUrl, onTopup, isLoading }: FinanceTopupFormProps) {
  const [amount, setAmount] = useState('');

  const parsedAmount = parseInt(amount.replace(/\D/g, ''), 10) || 0;
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

      {qrCodeUrl && (
        <div className="flex justify-center">
          <div className="bg-card overflow-hidden rounded-lg border p-3 shadow-sm">
            <Image src={qrCodeUrl} alt="Mã QR chuyển khoản" width={200} height={200} className="object-contain" />
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="text-muted-foreground mb-1 block text-sm">Số tiền đã chuyển khoản:</label>
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
        <Button type="submit" disabled={!isValid || isLoading} className="w-full">
          {isLoading ? 'Đang xử lý...' : 'Xác nhận nạp tiền'}
        </Button>
      </form>
    </div>
  );
}
