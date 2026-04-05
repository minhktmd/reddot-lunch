'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { formatPrice } from '@/shared/utils/format';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/atoms/select';
import type { MenuOfDayItemResponse } from '@/domains/menu';

const orderFormSchema = z.object({
  menuOfDayItemId: z.string().min(1, 'Vui lòng chọn món'),
  quantity: z.number().int().min(1, 'Ít nhất 1 phần'),
});

type OrderFormData = z.infer<typeof orderFormSchema>;

type OrderFormProps = {
  menuItems: MenuOfDayItemResponse[];
  defaultItemId?: string;
  defaultQuantity?: number;
  isLoading?: boolean;
  submitLabel?: string;
  onSubmit: (data: OrderFormData) => void;
  onCancel: () => void;
};

export function OrderForm({
  menuItems,
  defaultItemId,
  defaultQuantity = 1,
  isLoading,
  submitLabel = 'Xác nhận',
  onSubmit,
  onCancel,
}: OrderFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<OrderFormData>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: {
      menuOfDayItemId: defaultItemId ?? '',
      quantity: defaultQuantity,
    },
  });

  const selectedItemId = watch('menuOfDayItemId');

  useEffect(() => {
    if (defaultItemId) setValue('menuOfDayItemId', defaultItemId);
  }, [defaultItemId, setValue]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="rounded-lg border bg-gray-50 p-4">
      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Chọn món</label>
          <Select
            value={selectedItemId}
            onValueChange={(val) => setValue('menuOfDayItemId', val, { shouldValidate: true })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Chọn món ăn" />
            </SelectTrigger>
            <SelectContent>
              {menuItems.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.menuItem.name} — {formatPrice(item.price)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.menuOfDayItemId && (
            <p className="mt-1 text-xs text-red-600">{errors.menuOfDayItemId.message}</p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Số lượng</label>
          <input
            type="number"
            min={1}
            {...register('quantity', { valueAsNumber: true })}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
          {errors.quantity && <p className="mt-1 text-xs text-red-600">{errors.quantity.message}</p>}
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 cursor-pointer rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Đang xử lý...' : submitLabel}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="cursor-pointer rounded-md border px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
          >
            Hủy
          </button>
        </div>
      </div>
    </form>
  );
}
