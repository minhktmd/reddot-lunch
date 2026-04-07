'use client';

import { useEffect, useRef, useState } from 'react';

import { Button } from '@/shared/components/atoms/button';

import type { ExternalDishItem } from '@/domains/menu';

type MenuExternalRowProps = {
  item: ExternalDishItem;
  isLocked: boolean;
  onDelete: () => void;
  isLoading: boolean;
};

const CONFIRM_TIMEOUT_MS = 3000;

export function MenuExternalRow({ item, isLocked, onDelete, isLoading }: MenuExternalRowProps) {
  const [confirming, setConfirming] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleDeleteClick = () => {
    if (!confirming) {
      setConfirming(true);
      timerRef.current = setTimeout(() => setConfirming(false), CONFIRM_TIMEOUT_MS);
      return;
    }
    setConfirming(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    onDelete();
  };

  return (
    <div className="flex items-center gap-3 rounded-md border px-3 py-2">
      <span className="min-w-0 flex-1 truncate text-sm font-medium">{item.name}</span>
      <a
        href={item.orderUrl}
        target="_blank"
        rel="noopener noreferrer"
        title={item.orderUrl}
        className="min-w-0 max-w-48 truncate text-xs text-blue-600 underline hover:text-blue-800"
      >
        {item.orderUrl}
      </a>
      {!isLocked && (
        <Button
          variant={confirming ? 'destructive' : 'ghost'}
          size="sm"
          onClick={handleDeleteClick}
          disabled={isLoading}
          className="shrink-0"
        >
          {confirming ? 'Chắc chắn?' : 'Xóa'}
        </Button>
      )}
    </div>
  );
}
