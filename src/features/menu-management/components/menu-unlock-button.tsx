'use client'

import { useState } from 'react'

import { Button } from '@/shared/components/atoms/button'

import { useUnlockMenu } from '../hooks/use-unlock-menu'

type Props = { menuId: string }

export function MenuUnlockButton({ menuId }: Props) {
  const [confirming, setConfirming] = useState(false)
  const { mutate: unlock, isPending } = useUnlockMenu()

  const handleClick = () => {
    if (!confirming) {
      setConfirming(true)
      return
    }
    unlock(menuId, { onSettled: () => setConfirming(false) })
  }

  return (
    <Button
      variant={confirming ? 'destructive' : 'outline'}
      onClick={handleClick}
      disabled={isPending}
      onBlur={() => setConfirming(false)}
    >
      {isPending ? 'Đang mở...' : confirming ? 'Chắc chắn?' : 'Mở lại'}
    </Button>
  )
}
