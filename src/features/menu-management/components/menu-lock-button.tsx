'use client';

import { useState } from 'react';

import { Button } from '@/shared/components/atoms/button';

import { useLockMenu } from '../hooks/use-lock-menu';
import { useSaveMenuItems } from '../hooks/use-save-menu-items';
import { useMenuDraftStore } from '../stores/menu-draft.store';

type Props = { menuId: string };

type LockState = 'idle' | 'warn-unsaved' | 'confirming';

export function MenuLockButton({ menuId }: Props) {
  const [state, setState] = useState<LockState>('idle');
  const { mutate: lock, isPending: isLocking } = useLockMenu();
  const { mutate: save, isPending: isSaving } = useSaveMenuItems(menuId);
  const hasUnsavedChanges = useMenuDraftStore((s) => s.hasUnsavedChanges);
  const items = useMenuDraftStore((s) => s.items);

  const handleClick = () => {
    if (state === 'idle') {
      if (hasUnsavedChanges) {
        setState('warn-unsaved');
      } else {
        setState('confirming');
      }
      return;
    }
    if (state === 'confirming') {
      lock(menuId, { onSettled: () => setState('idle') });
    }
  };

  const handleSaveAndLock = () => {
    const validItems = items.filter((i) => i.name.trim() && i.price > 0);
    save(
      {
        items: validItems.map((i) => ({
          name: i.name.trim(),
          price: i.price,
          sideDishes: i.sideDishes.trim() || undefined,
        })),
      },
      {
        onSuccess: () => {
          lock(menuId, { onSettled: () => setState('idle') });
        },
        onError: () => setState('idle'),
      },
    );
  };

  const isPending = isLocking || isSaving;

  if (state === 'warn-unsaved') {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-amber-600">Có thay đổi chưa lưu</span>
        <Button variant="default" size="sm" onClick={handleSaveAndLock} disabled={isPending}>
          {isPending ? 'Đang lưu...' : 'Lưu và chốt'}
        </Button>
        <Button variant="outline" size="sm" onClick={() => setState('idle')} disabled={isPending}>
          Hủy
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant={state === 'confirming' ? 'destructive' : 'default'}
      onClick={handleClick}
      disabled={isPending}
      onBlur={() => setState('idle')}
    >
      {isPending ? 'Đang chốt...' : state === 'confirming' ? 'Chắc chắn?' : 'Chốt sổ'}
    </Button>
  );
}
