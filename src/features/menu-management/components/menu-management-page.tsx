'use client'

import { useEffect } from 'react'

import { useMenuDraftStore } from '../stores/menu-draft.store'
import { useTodayMenu } from '../hooks/use-today-menu'
import { MenuHeader } from './menu-header'
import { MenuDraftItemList, MenuPublishedItemList } from './menu-item-list'
import { MenuKitchenSummary } from './menu-kitchen-summary'

// Use a fixed date reference for the header display — won't change during session
const PAGE_DATE = new Date()

export function MenuManagementPage() {
  const { data, isLoading, isError } = useTodayMenu()
  const setItems = useMenuDraftStore((s) => s.setItems)

  // Initialize draft store with prefill data once when page loads
  useEffect(() => {
    if (data?.status === 'prefill') {
      setItems(
        data.items.map((item, idx) => ({
          tempId: `prefill-${idx}-${item.menuItemId}`,
          menuItemName: item.menuItemName,
          price: item.price,
          sideDishes: item.sideDishes,
        }))
      )
    }
  }, [data?.status]) // eslint-disable-line react-hooks/exhaustive-deps

  if (isLoading) {
    return <p className="py-12 text-center text-sm text-gray-400">Đang tải thực đơn...</p>
  }

  if (isError || !data) {
    return <p className="py-12 text-center text-sm text-red-500">Không thể tải thực đơn hôm nay.</p>
  }

  if (data.status === 'prefill') {
    return (
      <div>
        <MenuHeader status="prefill" menu={null} date={PAGE_DATE} />
        <MenuDraftItemList />
      </div>
    )
  }

  const { menu } = data
  const status = menu.isLocked ? 'locked' : 'published'

  return (
    <div>
      <MenuHeader status={status} menu={menu} date={new Date(menu.date)} />
      <MenuPublishedItemList menu={menu} isReadOnly={menu.isLocked} />
      {menu.isLocked && <MenuKitchenSummary />}
    </div>
  )
}
