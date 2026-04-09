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

  const sideDishList = item.sideDishes
    ? item.sideDishes
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  return (
    <div className="bg-card rounded-lg border p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <span className="text-muted-foreground text-xs">Món chính</span>
        <div className="flex shrink-0 items-center gap-2">
          {item.orderCount > 0 && (
            <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs">
              {item.orderCount} người đã chọn
            </span>
          )}
          <span className="font-semibold text-blue-600">{formatPrice(item.price)}</span>
        </div>
      </div>

      <p className="text-foreground mt-1 text-lg font-bold">{item.name}</p>

      {sideDishList.length > 0 && (
        <div className="mt-3">
          <span className="text-muted-foreground text-xs">Đồ ăn kèm</span>
          <div className="mt-1 space-y-0.5">
            {sideDishList.map((dish) => (
              <p key={dish} className="text-muted-foreground text-sm">
                ✔ {dish}
              </p>
            ))}
          </div>
        </div>
      )}

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
