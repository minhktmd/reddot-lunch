'use client';

import Image from 'next/image';

import { useMyBalance } from '@/features/finance/hooks/use-my-balance';
import { ThemeToggle } from '@/shared/components/atoms/theme-toggle';
import { cn } from '@/shared/lib/cn';

type HomeHeaderProps = {
  employeeId: string;
  employeeName: string;
  onChangeName: () => void;
};

export function HomeHeader({ employeeId, employeeName, onChangeName }: HomeHeaderProps) {
  const { data: balanceData, isLoading } = useMyBalance(employeeId);
  const balance = balanceData?.balance ?? 0;
  const isNegative = balance < 0;

  return (
    <header className="bg-card border-b px-4 py-3">
      <div className="mx-auto flex max-w-2xl items-center justify-between">
        <div className="flex items-center gap-2">
          <Image src="/reddot-logo.png" alt="Reddot" width={28} height={28} className="h-7 w-auto" />
          <span className="font-semibold">{employeeName}</span>
          {!isLoading && (
            <span className={cn('text-sm font-medium', isNegative ? 'text-red-600' : 'text-green-600')}>
              {isNegative
                ? `Nợ: ${Math.abs(balance).toLocaleString('vi-VN')}đ`
                : `Số dư: ${balance.toLocaleString('vi-VN')}đ`}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onChangeName} className="text-primary cursor-pointer text-sm hover:underline">
            Đổi người đặt
          </button>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
