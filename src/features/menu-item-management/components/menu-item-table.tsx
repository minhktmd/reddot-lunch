'use client';

import { useMemo, useState } from 'react';

import { useMenuItemsAll } from '../hooks/use-menu-items-all';
import { type MenuItemListItem } from '../types/menu-item-management.type';
import { MenuItemRow } from './menu-item-row';
import { MenuItemRowEdit } from './menu-item-row-edit';

function sortMenuItems(items: MenuItemListItem[]): MenuItemListItem[] {
  return [...items].sort((a, b) => {
    // Active first, then inactive
    if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
    // Within each group, sort by name asc
    return a.name.localeCompare(b.name, 'vi');
  });
}

export function MenuItemTable() {
  const { data: menuItems, isLoading, isError } = useMenuItemsAll();
  const [editingId, setEditingId] = useState<string | null>(null);

  const sorted = useMemo(() => (menuItems ? sortMenuItems(menuItems) : []), [menuItems]);

  if (isLoading) {
    return <p className="py-8 text-center text-sm text-gray-500">Đang tải...</p>;
  }

  if (isError) {
    return <p className="py-8 text-center text-sm text-red-500">Không thể tải danh sách món ăn.</p>;
  }

  if (sorted.length === 0) {
    return <p className="py-8 text-center text-sm text-gray-500">Chưa có món ăn nào.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full text-left">
        <thead className="border-b border-gray-200 bg-gray-50 text-xs font-medium uppercase tracking-wide text-gray-500">
          <tr>
            <th className="px-4 py-3">Tên món</th>
            <th className="px-4 py-3">Ngày tạo</th>
            <th className="px-4 py-3">Trạng thái</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {sorted.map((menuItem) =>
            editingId === menuItem.id ? (
              <MenuItemRowEdit key={menuItem.id} menuItem={menuItem} onCancel={() => setEditingId(null)} />
            ) : (
              <MenuItemRow key={menuItem.id} menuItem={menuItem} onEdit={() => setEditingId(menuItem.id)} />
            )
          )}
        </tbody>
      </table>
    </div>
  );
}
