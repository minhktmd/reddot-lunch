'use client'

import { useState } from 'react'

import { Button } from '@/shared/components/atoms/button'
import { Input } from '@/shared/components/atoms/input'
import { type MenuItemCatalogItem } from '@/domains/menu'

type Props = {
  catalogItems: MenuItemCatalogItem[]
  onAdd: (item: { menuItemName: string; price: number; sideDishes: string | null }) => void
  isPending?: boolean
}

export function MenuItemAddForm({ catalogItems, onAdd, isPending = false }: Props) {
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [sideDishes, setSideDishes] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [errors, setErrors] = useState<{ name?: string; price?: string }>({})

  const filtered =
    name.length > 0
      ? catalogItems.filter((item) => item.name.toLowerCase().includes(name.toLowerCase()))
      : []

  const handleSelectSuggestion = (item: MenuItemCatalogItem) => {
    setName(item.name)
    setPrice(String(item.lastUsedPrice ?? ''))
    setSideDishes(item.lastUsedSideDishes ?? '')
    setShowSuggestions(false)
    setErrors({})
  }

  const validate = () => {
    const newErrors: { name?: string; price?: string } = {}
    if (!name.trim()) newErrors.name = 'Tên món là bắt buộc'
    const parsedPrice = Number(price)
    if (!price || !Number.isInteger(parsedPrice) || parsedPrice < 1000) {
      newErrors.price = 'Giá không hợp lệ (tối thiểu 1.000đ)'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleAdd = () => {
    if (!validate()) return
    onAdd({
      menuItemName: name.trim(),
      price: Number(price),
      sideDishes: sideDishes.trim() || null,
    })
    setName('')
    setPrice('')
    setSideDishes('')
    setErrors({})
  }

  return (
    <div className="mt-4 rounded-lg border border-dashed border-border bg-muted p-4">
      <p className="mb-3 text-sm font-medium text-muted-foreground">Thêm món</p>
      <div className="relative flex flex-wrap items-start gap-2">
        <div className="relative flex flex-col gap-1">
          <Input
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              setShowSuggestions(true)
              setErrors((prev) => ({ ...prev, name: undefined }))
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            placeholder="Tên món..."
            className="w-48"
          />
          {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
          {showSuggestions && name.length > 0 && (
            <div className="absolute top-full left-0 z-10 mt-1 w-64 rounded-md border border-border bg-card shadow-lg">
              {filtered.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="w-full cursor-pointer px-3 py-2 text-left text-sm hover:bg-muted"
                  onMouseDown={() => handleSelectSuggestion(item)}
                >
                  <span className="font-medium">{item.name}</span>
                  {item.lastUsedPrice && (
                    <span className="ml-2 text-muted-foreground text-xs">{item.lastUsedPrice.toLocaleString('vi-VN')}đ</span>
                  )}
                </button>
              ))}
              {filtered.length === 0 && (
                <div className="px-3 py-2 text-sm text-muted-foreground">
                  Thêm món mới: <span className="font-medium">{name}</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <Input
            type="number"
            value={price}
            onChange={(e) => {
              setPrice(e.target.value)
              setErrors((prev) => ({ ...prev, price: undefined }))
            }}
            placeholder="Giá"
            className="w-28"
            min={1000}
            step={500}
          />
          {errors.price && <p className="text-xs text-red-500">{errors.price}</p>}
        </div>

        <div className="flex flex-col gap-1">
          <Input
            value={sideDishes}
            onChange={(e) => setSideDishes(e.target.value)}
            placeholder="Món ăn kèm"
            className="w-48"
          />
        </div>

        <Button onClick={handleAdd} disabled={isPending} size="default">
          {isPending ? 'Đang thêm...' : 'Thêm'}
        </Button>
      </div>
    </div>
  )
}
