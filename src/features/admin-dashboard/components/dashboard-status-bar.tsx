'use client';

import { useState } from 'react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/shared/components/atoms/alert-dialog';
import { Button } from '@/shared/components/atoms/button';
import { formatDateFull } from '@/shared/utils/format';

import type { MenuOfDayResponse } from '@/domains/menu';

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
  const [lockOpen, setLockOpen] = useState(false);
  const [unlockOpen, setUnlockOpen] = useState(false);

  const handleLockConfirm = () => {
    onLock();
    setLockOpen(false);
  };

  const handleUnlockConfirm = () => {
    onUnlock();
    setUnlockOpen(false);
  };

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card px-4 py-3">
      <span className="font-medium text-foreground">{dateLabel}</span>
      <span className="text-muted-foreground">•</span>
      <span
        className={`rounded-full px-2.5 py-0.5 text-sm font-medium ${
          menu.isLocked ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
        }`}
      >
        {statusLabel}
      </span>
      <span className="text-muted-foreground">•</span>
      {menu.isLocked ? (
        <AlertDialog open={unlockOpen} onOpenChange={setUnlockOpen}>
          <AlertDialogTrigger
            render={
              <Button variant="outline" size="sm" disabled={isUnlocking}>
                {isUnlocking ? 'Đang mở...' : 'Mở lại'}
              </Button>
            }
          />
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Mở lại thực đơn?</AlertDialogTitle>
              <AlertDialogDescription>
                Nhân viên sẽ có thể chỉnh sửa đơn hàng sau khi mở lại.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Hủy</AlertDialogCancel>
              <AlertDialogAction onClick={handleUnlockConfirm} disabled={isUnlocking}>
                {isUnlocking ? 'Đang mở...' : 'Xác nhận'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : (
        <AlertDialog open={lockOpen} onOpenChange={setLockOpen}>
          <AlertDialogTrigger
            render={
              <Button variant="destructive" size="sm" disabled={isLocking}>
                {isLocking ? 'Đang chốt...' : 'Chốt sổ'}
              </Button>
            }
          />
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Xác nhận chốt sổ?</AlertDialogTitle>
              <AlertDialogDescription>
                Nhân viên sẽ không thể thay đổi đơn hàng sau khi chốt.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Hủy</AlertDialogCancel>
              <AlertDialogAction variant="destructive" onClick={handleLockConfirm} disabled={isLocking}>
                {isLocking ? 'Đang chốt...' : 'Xác nhận'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
