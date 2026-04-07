'use client';

import { ExternalLink } from 'lucide-react';

import type { ExternalDishItem } from '@/domains/menu';

type OrderExternalDishesProps = {
  items: ExternalDishItem[];
};

export function OrderExternalDishes({ items }: OrderExternalDishesProps) {
  return (
    <div>
      <h3 className="text-foreground mb-2 text-sm font-medium">Món ăn ngoài</h3>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={`${item.name}-${item.orderUrl}`} className="rounded-md border px-3 py-2">
            <p className="text-sm font-medium">{item.name}</p>
            <a
              href={item.orderUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary inline-flex items-center text-xs underline-offset-4 hover:underline"
            >
              Đặt tại đây <ExternalLink className="ml-1 h-3 w-3" />
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
