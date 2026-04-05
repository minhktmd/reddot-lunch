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
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="font-medium text-gray-900">{item.menuItem.name}</p>
          {item.sideDishes && <p className="mt-0.5 text-sm text-gray-500">{item.sideDishes}</p>}
        </div>
        <span className="shrink-0 font-semibold text-blue-600">{formatPrice(item.price)}</span>
      </div>

      {!isLocked && (
        <div className="mt-3 flex items-center gap-2">
          <div className="flex items-center rounded-md border border-gray-300">
            <button
              type="button"
              onClick={handleDecrement}
              disabled={quantity <= 1}
              className="cursor-pointer px-2.5 py-1 text-sm text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Giảm số lượng"
            >
              −
            </button>
            <span className="min-w-[2rem] text-center text-sm font-medium text-gray-800">{quantity}</span>
            <button
              type="button"
              onClick={handleIncrement}
              className="cursor-pointer px-2.5 py-1 text-sm text-gray-600 hover:bg-gray-100"
              aria-label="Tăng số lượng"
            >
              +
            </button>
          </div>
          <button
            onClick={() => onPlaceOrder(item.id, quantity)}
            disabled={isLoading}
            className="flex-1 cursor-pointer rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? 'Đang đặt...' : 'Đặt món'}
          </button>
        </div>
      )}
    </div>
  );
}
