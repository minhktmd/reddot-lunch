'use client'

import { useState } from 'react'

import { Button } from '@/shared/components/atoms/button'

import { usePublishMenu } from '../hooks/use-publish-menu'
import { useMenuDraftStore } from '../stores/menu-draft.store'

export function MenuPublishButton() {
  const [confirming, setConfirming] = useState(false)
  const { mutate: publish, isPending } = usePublishMenu()
  const items = useMenuDraftStore((s) => s.items)
  const setPublishError = useMenuDraftStore((s) => s.setPublishError)

  const handleClick = () => {
    if (items.length === 0) {
      setPublishError('Cần ít nhất một món để đăng thực đơn')
      return
    }
    setPublishError('')
    if (!confirming) {
      setConfirming(true)
      return
    }
    publish(
      {
        items: items.map((item) => ({
          menuItemName: item.menuItemName,
          price: item.price,
          sideDishes: item.sideDishes ?? undefined,
        })),
      },
      { onSettled: () => setConfirming(false) }
    )
  }

  return (
    <Button
      variant={confirming ? 'destructive' : 'default'}
      onClick={handleClick}
      disabled={isPending}
      onBlur={() => setConfirming(false)}
    >
      {isPending ? 'Đang đăng...' : confirming ? 'Chắc chắn?' : 'Đăng thực đơn'}
    </Button>
  )
}
