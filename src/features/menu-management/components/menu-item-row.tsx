'use client'

import { useState } from 'react'

import { Button } from '@/shared/components/atoms/button'
import { type MenuOfDayItemResponse } from '@/domains/menu'

import { MenuItemRowEdit } from './menu-item-row-edit'

type Props = {
  item: MenuOfDayItemResponse
  isReadOnly?: boolean
  onEdit?: (patch: { price: number; sideDishes: string | null }) => void
  onRemove?: () => void
  isEditPending?: boolean
  isRemovePending?: boolean
}

export function MenuItemRow({
  item,
  isReadOnly = false,
  onEdit,
  onRemove,
  isEditPending = false,
  isRemovePending = false,
}: Props) {
  const [editing, setEditing] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const handleEdit = (patch: { price: number; sideDishes: string | null }) => {
    onEdit?.(patch)
    setEditing(false)
  }

  if (editing) {
    return (
      <MenuItemRowEdit
        item={item}
        onSave={handleEdit}
        onCancel={() => setEditing(false)}
        isPending={isEditPending}
      />
    )
  }

  return (
    <tr className="border-b border-gray-100 last:border-0">
      <td className="px-4 py-3 font-medium text-gray-900">{item.menuItem.name}</td>
      <td className="px-4 py-3 text-gray-700">{item.price.toLocaleString('vi-VN')}đ</td>
      <td className="px-4 py-3 text-gray-500">{item.sideDishes ?? '—'}</td>
      {!isReadOnly && (
        <td className="px-4 py-3">
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setConfirmingDelete(false)
                setEditing(true)
              }}
            >
              Sửa
            </Button>
            {confirmingDelete ? (
              <Button
                variant="destructive"
                size="sm"
                disabled={isRemovePending}
                onBlur={() => setConfirmingDelete(false)}
                onClick={() => {
                  onRemove?.()
                  setConfirmingDelete(false)
                }}
              >
                {isRemovePending ? 'Đang xóa...' : 'Chắc chắn?'}
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="text-red-500 hover:text-red-700"
                onClick={() => setConfirmingDelete(true)}
              >
                Xóa
              </Button>
            )}
          </div>
        </td>
      )}
    </tr>
  )
}
