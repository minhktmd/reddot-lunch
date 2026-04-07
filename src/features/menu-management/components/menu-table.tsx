'use client';

import { useCallback, useMemo } from 'react';

import { type MenuOfDayItemResponse } from '@/domains/menu';

import { useMenuDraftStore } from '../stores/menu-draft.store';
import { type DraftItem } from '../types/menu-management.type';

import { MenuTableRow } from './menu-table-row';
import { MenuTableRowReadonly } from './menu-table-row-readonly';

let tempIdCounter = 0;

function createTempId(): string {
  return `draft-${++tempIdCounter}-${Date.now()}`;
}

function createEmptyDraftItem(): DraftItem {
  return { tempId: createTempId(), name: '', price: 0, sideDishes: '' };
}

// ─── Editable table (pre-publish and post-publish) ────────────────────────────

export function MenuTable() {
  const items = useMenuDraftStore((s) => s.items);
  const updateItem = useMenuDraftStore((s) => s.updateItem);
  const removeItem = useMenuDraftStore((s) => s.removeItem);
  const setItems = useMenuDraftStore((s) => s.setItems);

  // Always show items + one empty row at the end
  const emptyRow = useMemo(() => createEmptyDraftItem(), [items.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleUpdateEmptyRow = useCallback(
    (patch: Partial<Omit<DraftItem, 'tempId'>>) => {
      // When typing in empty row, auto-fill price/sideDishes from the last real item
      const lastItem = items[items.length - 1];
      const autoFill = lastItem ? { price: lastItem.price, sideDishes: lastItem.sideDishes } : {};
      const newItem: DraftItem = { ...emptyRow, ...autoFill, ...patch };
      setItems([...items, newItem]);
    },
    [emptyRow, items, setItems]
  );

  return (
    <div className="border-border overflow-x-auto rounded-lg border">
      <table className="w-full min-w-150 text-left">
        <thead className="border-border bg-muted text-muted-foreground border-b text-xs font-medium tracking-wide uppercase">
          <tr>
            <th className="px-4 py-3">Tên món</th>
            <th className="w-32 px-4 py-3">Giá</th>
            <th className="px-4 py-3">Món ăn kèm</th>
            <th className="w-20 px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <MenuTableRow
              key={item.tempId}
              item={item}
              onUpdate={(patch) => updateItem(item.tempId, patch)}
              onRemove={() => removeItem(item.tempId)}
            />
          ))}
          <MenuTableRow
            key={emptyRow.tempId}
            item={emptyRow}
            onUpdate={handleUpdateEmptyRow}
            onRemove={() => {}}
            isEmptyRow
          />
        </tbody>
      </table>
    </div>
  );
}

// ─── Read-only table (locked state) ──────────────────────────────────────────

type ReadonlyTableProps = {
  items: MenuOfDayItemResponse[];
};

export function MenuTableReadonly({ items }: ReadonlyTableProps) {
  return (
    <div className="border-border overflow-x-auto rounded-lg border">
      <table className="w-full min-w-150 text-left">
        <thead className="border-border bg-muted text-muted-foreground border-b text-xs font-medium tracking-wide uppercase">
          <tr>
            <th className="px-4 py-3">Tên món</th>
            <th className="w-32 px-4 py-3">Giá</th>
            <th className="px-4 py-3">Món ăn kèm</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td colSpan={3} className="text-muted-foreground px-4 py-6 text-center text-sm">
                Chưa có món nào.
              </td>
            </tr>
          ) : (
            items.map((item) => <MenuTableRowReadonly key={item.id} item={item} />)
          )}
        </tbody>
      </table>
    </div>
  );
}
