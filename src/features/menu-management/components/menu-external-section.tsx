'use client';


import { useSaveExternalDishes } from '../hooks/use-save-external-dishes';
import { useMenuDraftStore } from '../stores/menu-draft.store';

import { MenuExternalAddForm } from './menu-external-add-form';
import { MenuExternalRow } from './menu-external-row';

import type { ExternalDishItem } from '@/domains/menu';

type MenuExternalSectionProps =
  | { mode: 'prefill' }
  | { mode: 'published'; menuId: string; externalDishes: ExternalDishItem[]; isLocked: boolean };

export function MenuExternalSection(props: MenuExternalSectionProps) {
  if (props.mode === 'prefill') {
    return <PrefillExternalSection />;
  }
  return (
    <PublishedExternalSection menuId={props.menuId} externalDishes={props.externalDishes} isLocked={props.isLocked} />
  );
}

// Screen 1: store-buffered
function PrefillExternalSection() {
  const externalDishes = useMenuDraftStore((s) => s.externalDishes);
  const addExternalDish = useMenuDraftStore((s) => s.addExternalDish);
  const removeExternalDish = useMenuDraftStore((s) => s.removeExternalDish);

  const items: ExternalDishItem[] = externalDishes.map((d) => ({ name: d.name, orderUrl: d.orderUrl }));

  return (
    <div className="mt-6">
      <h3 className="text-foreground mb-3 text-sm font-semibold">Món ăn ngoài</h3>

      {items.length > 0 && (
        <div className="mb-3 space-y-2">
          {externalDishes.map((dish) => (
            <MenuExternalRow
              key={dish.tempId}
              item={{ name: dish.name, orderUrl: dish.orderUrl }}
              isLocked={false}
              onDelete={() => removeExternalDish(dish.tempId)}
              isLoading={false}
            />
          ))}
        </div>
      )}

      {items.length === 0 && <p className="text-muted-foreground mb-3 text-sm">Chưa có món ăn ngoài nào.</p>}

      <MenuExternalAddForm onAdd={(name, orderUrl) => addExternalDish({ name, orderUrl })} isLoading={false} />
    </div>
  );
}

// Screens 2 & 3: API-backed
function PublishedExternalSection({
  menuId,
  externalDishes = [],
  isLocked,
}: {
  menuId: string;
  externalDishes: ExternalDishItem[];
  isLocked: boolean;
}) {
  const { mutate, isPending } = useSaveExternalDishes();

  const handleAdd = (name: string, orderUrl: string) => {
    const updated = [...externalDishes, { name, orderUrl }];
    mutate({ menuId, externalDishes: updated });
  };

  const handleDelete = (index: number) => {
    const updated = externalDishes.filter((_, i) => i !== index);
    mutate({ menuId, externalDishes: updated });
  };

  return (
    <div className="mt-6">
      <h3 className="text-foreground mb-3 text-sm font-semibold">Món ăn ngoài</h3>

      {externalDishes.length > 0 && (
        <div className="mb-3 space-y-2">
          {externalDishes.map((item, index) => (
            <MenuExternalRow
              key={`${item.name}-${item.orderUrl}`}
              item={item}
              isLocked={isLocked}
              onDelete={() => handleDelete(index)}
              isLoading={isPending}
            />
          ))}
        </div>
      )}

      {externalDishes.length === 0 && <p className="text-muted-foreground mb-3 text-sm">Chưa có món ăn ngoài nào.</p>}

      {!isLocked && <MenuExternalAddForm onAdd={handleAdd} isLoading={isPending} />}
    </div>
  );
}
