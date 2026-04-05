'use client';

import type { MenuOfDayResponse } from '@/domains/menu';
import { Button } from '@/shared/components/atoms/button';
import { formatDateFull } from '@/shared/utils/format';

type Props = {
  menu: MenuOfDayResponse;
  onLock: () => void;
  onUnlock: () => void;
  isLocking: boolean;
  isUnlocking: boolean;
};

export function DashboardStatusBar({ menu, onLock, onUnlock, isLocking, isUnlocking }: Props) {
  const dateLabel = formatDateFull(menu.date);
  const statusLabel = menu.isLocked ? 'Đã chốt' : 'Đã đăng';

  const handleLock = () => {
    if (!window.confirm('Xác nhận chốt sổ? Nhân viên sẽ không thể thay đổi đơn hàng sau khi chốt.')) return;
    onLock();
  };

  const handleUnlock = () => {
    if (!window.confirm('Xác nhận mở lại? Nhân viên sẽ có thể thay đổi đơn hàng.')) return;
    onUnlock();
  };

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3">
      <span className="font-medium text-gray-800">{dateLabel}</span>
      <span className="text-gray-400">•</span>
      <span
        className={`rounded-full px-2.5 py-0.5 text-sm font-medium ${
          menu.isLocked ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
        }`}
      >
        {statusLabel}
      </span>
      <span className="text-gray-400">•</span>
      {menu.isLocked ? (
        <Button variant="outline" size="sm" onClick={handleUnlock} disabled={isUnlocking}>
          {isUnlocking ? 'Đang mở...' : 'Mở lại'}
        </Button>
      ) : (
        <Button variant="destructive" size="sm" onClick={handleLock} disabled={isLocking}>
          {isLocking ? 'Đang chốt...' : 'Chốt sổ'}
        </Button>
      )}
    </div>
  );
}
