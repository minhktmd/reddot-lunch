'use client';

import { Button } from '@/shared/components/atoms/button';

import { useSaveMenuItems } from '../hooks/use-save-menu-items';
import { useMenuDraftStore } from '../stores/menu-draft.store';

import { MenuLockButton } from './menu-lock-button';
import { MenuPublishButton } from './menu-publish-button';
import { MenuStatusBadge } from './menu-status-badge';
import { MenuUnlockButton } from './menu-unlock-button';

import type { MenuOfDayResponse } from '@/domains/menu';

type MenuStatus = 'prefill' | 'published' | 'locked';

type Props = {
  status: MenuStatus;
  menu: MenuOfDayResponse | null;
  date: Date;
};

function formatDate(date: Date): string {
  const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  // Date is stored as UTC midnight VN time — offset back to get VN date
  const vnDate = new Date(date.getTime() + 7 * 60 * 60 * 1000);
  const dayName = days[vnDate.getUTCDay()];
  const day = String(vnDate.getUTCDate()).padStart(2, '0');
  const month = String(vnDate.getUTCMonth() + 1).padStart(2, '0');
  const year = vnDate.getUTCFullYear();
  return `${dayName}, ${day}/${month}/${year}`;
}

export function MenuHeader({ status, menu, date }: Props) {
  const hasUnsavedChanges = useMenuDraftStore((s) => s.hasUnsavedChanges);
  const items = useMenuDraftStore((s) => s.items);
  const { mutate: save, isPending: isSaving } = useSaveMenuItems(menu?.id ?? '');

  const handleSave = () => {
    const validItems = items.filter((i) => i.name.trim() && i.price > 0);
    save({
      items: validItems.map((i) => ({
        name: i.name.trim(),
        price: i.price,
        sideDishes: i.sideDishes.trim() || undefined,
      })),
    });
  };

  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <h2 className="text-foreground text-lg font-semibold">{formatDate(date)}</h2>
        <MenuStatusBadge status={status} />
      </div>
      <div className="flex items-center gap-2">
        {status === 'prefill' && <MenuPublishButton />}
        {status === 'published' && menu && (
          <>
            {hasUnsavedChanges && (
              <Button variant="default" onClick={handleSave} disabled={isSaving}>
                {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
              </Button>
            )}
            <MenuLockButton menuId={menu.id} />
          </>
        )}
        {status === 'locked' && menu && <MenuUnlockButton menuId={menu.id} />}
      </div>
    </div>
  );
}
