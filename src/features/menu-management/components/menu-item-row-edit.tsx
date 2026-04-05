'use client'

import { useState } from 'react'

import { Button } from '@/shared/components/atoms/button'
import { Input } from '@/shared/components/atoms/input'
import { type MenuOfDayItemResponse } from '@/domains/menu'

type Props = {
  item: MenuOfDayItemResponse
  onSave: (patch: { price: number; sideDishes: string | null }) => void
  onCancel: () => void
  isPending?: boolean
}

export function MenuItemRowEdit({ item, onSave, onCancel, isPending = false }: Props) {
  const [price, setPrice] = useState(String(item.price))
  const [sideDishes, setSideDishes] = useState(item.sideDishes ?? '')
  const [priceError, setPriceError] = useState('')

  const handleSave = () => {
    const parsed = Number(price)
    if (!Number.isInteger(parsed) || parsed < 1000) {
      setPriceError('Giá không hợp lệ (tối thiểu 1.000đ)')
      return
    }
    setPriceError('')
    onSave({ price: parsed, sideDishes: sideDishes.trim() || null })
  }

  return (
    <tr className="border-b border-blue-100 bg-blue-50 last:border-0">
      <td className="px-4 py-2 font-medium text-gray-900">{item.menuItem.name}</td>
      <td className="px-4 py-2">
        <div className="flex flex-col gap-1">
          <Input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-28"
            min={1000}
            step={500}
          />
          {priceError && <p className="text-xs text-red-500">{priceError}</p>}
        </div>
      </td>
      <td className="px-4 py-2">
        <Input
          value={sideDishes}
          onChange={(e) => setSideDishes(e.target.value)}
          placeholder="Món ăn kèm"
          className="w-48"
        />
      </td>
      <td className="px-4 py-2">
        <div className="flex items-center justify-end gap-2">
          <Button size="sm" onClick={handleSave} disabled={isPending}>
            {isPending ? 'Đang lưu...' : 'Lưu'}
          </Button>
          <Button size="sm" variant="outline" onClick={onCancel} disabled={isPending}>
            Hủy
          </Button>
        </div>
      </td>
    </tr>
  )
}
