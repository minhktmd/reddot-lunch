'use client';

import { Button } from '@/shared/components/atoms/button';
import { cn } from '@/shared/lib/cn';

import { useToggleMenuItemActive } from '../hooks/use-edit-menu-item';
import { type MenuItemListItem } from '../types/menu-item-management.type';

type MenuItemRowProps = {
  menuItem: MenuItemListItem;
  onEdit: () => void;
};

export function MenuItemRow({ menuItem, onEdit }: MenuItemRowProps) {
  const { mutate: toggleActive, isPending } = useToggleMenuItemActive();

  const isInactive = !menuItem.isActive;

  const handleToggleActive = () => {
    toggleActive({ id: menuItem.id, isActive: !menuItem.isActive });
  };

  const formattedDate = new Date(menuItem.createdAt).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return (
    <tr className={cn('border-b border-gray-100 transition-colors hover:bg-gray-50', isInactive && 'opacity-50')}>
      <td className="px-4 py-3 text-sm font-medium text-gray-900">{menuItem.name}</td>
      <td className="px-4 py-3 text-sm text-gray-600">{formattedDate}</td>
      <td className="px-4 py-3 text-sm">
        <span
          className={cn(
            'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
            menuItem.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
          )}
        >
          {menuItem.isActive ? 'Hoạt động' : 'Không hoạt động'}
        </span>
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onEdit}>
            Sửa
          </Button>
          <Button
            variant={menuItem.isActive ? 'destructive' : 'outline'}
            size="sm"
            onClick={handleToggleActive}
            disabled={isPending}
            aria-label={menuItem.isActive ? `Vô hiệu hóa ${menuItem.name}` : `Kích hoạt ${menuItem.name}`}
          >
            {menuItem.isActive ? 'Vô hiệu' : 'Kích hoạt'}
          </Button>
        </div>
      </td>
    </tr>
  );
}
