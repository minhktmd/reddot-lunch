'use client';

import { useState } from 'react';

import { formatPrice } from '@/shared/utils/format';

import type { MenuOfDayItemResponse } from '@/domains/menu';

type OrderMenuCardProps = {
  item: MenuOfDayItemResponse;
  isLocked: boolean;
  isLoading: boolean;
  onPlaceOrder: (itemId: string, quantity: number) => void;
};

export function OrderMenuCard({ item, isLocked, isLoading, onPlaceOrder }: OrderMenuCardProps) {
  const [quantity, setQuantity] = useState(1);

  const handleDecrement = () => setQuantity((q) => Math.max(1, q - 1));
  const handleIncrement = () => setQuantity((q) => q + 1);

  return (
    <div className="bg-card rounded-lg border p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-foreground font-medium">{item.name}</p>
          {item.sideDishes && <p className="text-muted-foreground mt-0.5 text-sm">{item.sideDishes}</p>}
        </div>
        <span className="shrink-0 font-semibold text-blue-600">{formatPrice(item.price)}</span>
      </div>

      {!isLocked && (
        <div className="mt-3 flex items-center gap-2">
          <div className="border-border flex items-center rounded-md border">
            <button
              type="button"
              onClick={handleDecrement}
              disabled={quantity <= 1}
              className="text-muted-foreground hover:bg-muted cursor-pointer px-2.5 py-1 text-sm disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Giảm số lượng"
            >
              −
            </button>
            <span className="text-foreground min-w-8 text-center text-sm font-medium">{quantity}</span>
            <button
              type="button"
              onClick={handleIncrement}
              className="text-muted-foreground hover:bg-muted cursor-pointer px-2.5 py-1 text-sm"
              aria-label="Tăng số lượng"
            >
              +
            </button>
          </div>
          <button
            onClick={() => onPlaceOrder(item.id, quantity)}
            disabled={isLoading}
            className="bg-primary text-primary-foreground hover:bg-primary/90 flex-1 cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? 'Đang đặt...' : 'Đặt món'}
          </button>
        </div>
      )}
    </div>
  );
}
