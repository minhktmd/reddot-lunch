'use client'

import { useState } from 'react'

import { Button } from '@/shared/components/atoms/button'

import { useLockMenu } from '../hooks/use-lock-menu'

type Props = { menuId: string }

export function MenuLockButton({ menuId }: Props) {
  const [confirming, setConfirming] = useState(false)
  const { mutate: lock, isPending } = useLockMenu()

  const handleClick = () => {
    if (!confirming) {
      setConfirming(true)
      return
    }
    lock(menuId, { onSettled: () => setConfirming(false) })
  }

  return (
    <Button
      variant={confirming ? 'destructive' : 'default'}
      onClick={handleClick}
      disabled={isPending}
      onBlur={() => setConfirming(false)}
    >
      {isPending ? 'Đang chốt...' : confirming ? 'Chắc chắn?' : 'Chốt sổ'}
    </Button>
  )
}
