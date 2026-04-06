'use client';

import { useState } from 'react';

import { Button } from '@/shared/components/atoms/button';
import { Input } from '@/shared/components/atoms/input';

import { type DraftItem } from '../types/menu-management.type';

import { MenuNameCell } from './menu-name-cell';

type Props = {
  item: DraftItem;
  onUpdate: (patch: Partial<Omit<DraftItem, 'tempId'>>) => void;
  onRemove: () => void;
  isEmptyRow?: boolean;
};

export function MenuTableRow({ item, onUpdate, onRemove, isEmptyRow = false }: Props) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const handlePriceChange = (value: string) => {
    const digits = value.replace(/\D/g, '');
    onUpdate({ price: digits ? parseInt(digits, 10) : 0 });
  };

  return (
    <tr className="border-b border-border last:border-0">
      <td className="px-2 py-1">
        <MenuNameCell
          value={item.name}
          onChange={(name) => onUpdate({ name })}
          onSelectSuggestion={(s) => onUpdate({ name: s.name, price: s.price })}
        />
      </td>
      <td className="px-2 py-1">
        <Input
          value={item.price || ''}
          onChange={(e) => handlePriceChange(e.target.value)}
          placeholder="Giá"
          className="h-8 w-28 border-0 bg-transparent px-2 shadow-none focus-visible:ring-1"
        />
      </td>
      <td className="px-2 py-1">
        <Input
          value={item.sideDishes}
          onChange={(e) => onUpdate({ sideDishes: e.target.value })}
          placeholder="Món ăn kèm"
          className="h-8 w-full border-0 bg-transparent px-2 shadow-none focus-visible:ring-1"
        />
      </td>
      <td className="px-2 py-1 w-20">
        {!isEmptyRow && (
          <>
            {confirmingDelete ? (
              <Button
                variant="destructive"
                size="sm"
                className="h-7 text-xs"
                onBlur={() => setConfirmingDelete(false)}
                onClick={() => {
                  onRemove();
                  setConfirmingDelete(false);
                }}
              >
                Chắc chắn?
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-red-500 hover:text-red-700"
                onClick={() => setConfirmingDelete(true)}
              >
                Xóa
              </Button>
            )}
          </>
        )}
      </td>
    </tr>
  );
}
