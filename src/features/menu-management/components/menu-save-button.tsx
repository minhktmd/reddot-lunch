'use client';

import { Button } from '@/shared/components/atoms/button';

import { useSaveMenuItems } from '../hooks/use-save-menu-items';
import { useMenuDraftStore } from '../stores/menu-draft.store';

type Props = {
  menuId: string;
};

export function MenuSaveButton({ menuId }: Props) {
  const { mutate: save, isPending } = useSaveMenuItems(menuId);
  const items = useMenuDraftStore((s) => s.items);

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
    <Button variant="outline" onClick={handleSave} disabled={isPending}>
      {isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
    </Button>
  );
}
