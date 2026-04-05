'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { Button } from '@/shared/components/atoms/button';
import { Input } from '@/shared/components/atoms/input';

import { useAddMenuItem } from '../hooks/use-add-menu-item';
import { addMenuItemSchema, type AddMenuItemInput } from '../types/menu-item-management.type';

export function MenuItemAddForm() {
  const { mutate: addMenuItem, isPending } = useAddMenuItem();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddMenuItemInput>({
    resolver: zodResolver(addMenuItemSchema),
  });

  const onSubmit = (data: AddMenuItemInput) => {
    addMenuItem(data, { onSuccess: () => reset() });
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-wrap items-start gap-2 rounded-lg border border-gray-200 bg-gray-50 p-4"
    >
      <div className="flex flex-col gap-1">
        <Input placeholder="Tên món *" {...register('name')} className="w-60" />
        {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
      </div>

      <Button type="submit" disabled={isPending} size="md">
        {isPending ? 'Đang thêm...' : 'Thêm'}
      </Button>
    </form>
  );
}
