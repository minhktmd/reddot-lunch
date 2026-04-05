'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { Button } from '@/shared/components/atoms/button';
import { Input } from '@/shared/components/atoms/input';

import { useEditMenuItem } from '../hooks/use-edit-menu-item';
import { editMenuItemSchema, type EditMenuItemInput, type MenuItemListItem } from '../types/menu-item-management.type';

type MenuItemRowEditProps = {
  menuItem: MenuItemListItem;
  onCancel: () => void;
};

export function MenuItemRowEdit({ menuItem, onCancel }: MenuItemRowEditProps) {
  const { mutate: editMenuItem, isPending } = useEditMenuItem();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EditMenuItemInput>({
    resolver: zodResolver(editMenuItemSchema),
    defaultValues: {
      name: menuItem.name,
    },
  });

  const onSubmit = (data: EditMenuItemInput) => {
    editMenuItem({ id: menuItem.id, ...data }, { onSuccess: onCancel });
  };

  return (
    <tr className="bg-blue-50">
      <td colSpan={4} className="px-4 py-3">
        <form onSubmit={handleSubmit(onSubmit)} className="flex items-start gap-2">
          <div className="flex flex-col gap-1">
            <Input placeholder="Tên món *" {...register('name')} className="w-60" />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={isPending} size="sm">
              {isPending ? 'Đang lưu...' : 'Lưu'}
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={onCancel} disabled={isPending}>
              Hủy
            </Button>
          </div>
        </form>
      </td>
    </tr>
  );
}
