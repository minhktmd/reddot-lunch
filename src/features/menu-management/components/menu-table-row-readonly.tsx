'use client';

import { type MenuOfDayItemResponse } from '@/domains/menu';

type Props = {
  item: MenuOfDayItemResponse;
};

export function MenuTableRowReadonly({ item }: Props) {
  return (
    <tr className="border-border border-b last:border-0">
      <td className="text-foreground px-4 py-3 font-medium">{item.name}</td>
      <td className="text-foreground px-4 py-3">{item.price.toLocaleString('vi-VN')}đ</td>
      <td className="text-muted-foreground px-4 py-3">{item.sideDishes ?? '—'}</td>
    </tr>
  );
}
