'use client'

import { type MenuOfDayResponse } from '@/domains/menu'

import { MenuStatusBadge } from './menu-status-badge'
import { MenuPublishButton } from './menu-publish-button'
import { MenuLockButton } from './menu-lock-button'
import { MenuUnlockButton } from './menu-unlock-button'

type MenuStatus = 'prefill' | 'published' | 'locked'

type Props = {
  status: MenuStatus
  menu: MenuOfDayResponse | null
  date: Date
}

function formatDate(date: Date): string {
  const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy']
  // Date is stored as UTC midnight VN time — offset back to get VN date
  const vnDate = new Date(date.getTime() + 7 * 60 * 60 * 1000)
  const dayName = days[vnDate.getUTCDay()]
  const day = String(vnDate.getUTCDate()).padStart(2, '0')
  const month = String(vnDate.getUTCMonth() + 1).padStart(2, '0')
  const year = vnDate.getUTCFullYear()
  return `${dayName}, ${day}/${month}/${year}`
}

export function MenuHeader({ status, menu, date }: Props) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-semibold text-foreground">{formatDate(date)}</h2>
        <MenuStatusBadge status={status} />
      </div>
      <div>
        {status === 'prefill' && <MenuPublishButton />}
        {status === 'published' && menu && <MenuLockButton menuId={menu.id} />}
        {status === 'locked' && menu && <MenuUnlockButton menuId={menu.id} />}
      </div>
    </div>
  )
}
