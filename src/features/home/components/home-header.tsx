'use client';

import { ThemeToggle } from '@/shared/components/atoms/theme-toggle';

type HomeHeaderProps = {
  employeeName: string;
  onChangeName: () => void;
};

export function HomeHeader({ employeeName, onChangeName }: HomeHeaderProps) {
  return (
    <header className="border-b bg-card px-4 py-3">
      <div className="mx-auto flex max-w-2xl items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">🍱</span>
          <span className="font-semibold">{employeeName}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onChangeName} className="cursor-pointer text-sm text-primary hover:underline">
            Đổi người đặt
          </button>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
