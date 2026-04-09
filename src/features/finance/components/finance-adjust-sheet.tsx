'use client';

import { useState } from 'react';

import { Button } from '@/shared/components/atoms/button';
import { Input } from '@/shared/components/atoms/input';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/shared/components/atoms/sheet';

import { useAdjustBalance } from '../hooks/use-adjust-balance';

type FinanceAdjustSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeId: string;
  employeeName: string;
  currentBalance: number;
  adminEmployeeId: string;
};

export function FinanceAdjustSheet({
  open,
  onOpenChange,
  employeeId,
  employeeName,
  currentBalance,
  adminEmployeeId,
}: FinanceAdjustSheetProps) {
  const [targetBalance, setTargetBalance] = useState('');
  const [note, setNote] = useState('');
  const adjustMutation = useAdjustBalance();

  const parsedTarget = parseInt(targetBalance.replace(/\D/g, ''), 10);
  const isNegativeInput = targetBalance.startsWith('-');
  const finalTarget = isNegativeInput ? -Math.abs(parsedTarget) : parsedTarget;
  const isValid = !isNaN(parsedTarget);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    adjustMutation.mutate(
      { employeeId, targetBalance: finalTarget, note: note || undefined, adminEmployeeId },
      {
        onSuccess: () => {
          onOpenChange(false);
          setTargetBalance('');
          setNote('');
        },
      }
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Sửa số dư — {employeeName}</SheetTitle>
          <SheetDescription>
            Số dư hiện tại: {currentBalance.toLocaleString('vi-VN')}đ
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-4 px-4">
          <div>
            <label className="text-muted-foreground mb-1 block text-sm">Đặt số dư về:</label>
            <div className="flex items-center gap-2">
              <Input
                type="text"
                inputMode="numeric"
                value={targetBalance}
                onChange={(e) => setTargetBalance(e.target.value)}
                placeholder="0"
              />
              <span className="text-muted-foreground text-sm">đ</span>
            </div>
          </div>
          <div>
            <label className="text-muted-foreground mb-1 block text-sm">Ghi chú:</label>
            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Admin adjustment" />
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={!isValid || adjustMutation.isPending} className="flex-1">
              {adjustMutation.isPending ? 'Đang xử lý...' : 'Xác nhận'}
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Hủy
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
