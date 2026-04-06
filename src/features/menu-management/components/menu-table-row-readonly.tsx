'use client';

import { type MenuOfDayItemResponse } from '@/domains/menu';

type Props = {
  item: MenuOfDayItemResponse;
};

export function MenuTableRowReadonly({ item }: Props) {
  return (
    <tr className="border-b border-border last:border-0">
      <td className="px-4 py-3 font-medium text-foreground">{item.name}</td>
      <td className="px-4 py-3 text-foreground">{item.price.toLocaleString('vi-VN')}đ</td>
      <td className="px-4 py-3 text-muted-foreground">{item.sideDishes ?? '—'}</td>
    </tr>
  );
}
