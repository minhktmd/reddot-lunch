'use client';

import Image from 'next/image';

import { ThemeToggle } from '@/shared/components/atoms/theme-toggle';

type HomeHeaderProps = {
  employeeName: string;
  onChangeName: () => void;
};

export function HomeHeader({ employeeName, onChangeName }: HomeHeaderProps) {
  return (
    <header className="bg-card border-b px-4 py-3">
      <div className="mx-auto flex max-w-2xl items-center justify-between">
        <div className="flex items-center gap-2">
          <Image src="/reddot-logo.png" alt="Reddot" width={28} height={28} className="h-7 w-auto" />
          <span className="font-semibold">{employeeName}</span>
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
