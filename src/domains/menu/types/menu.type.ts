export type MenuOfDayItemResponse = {
  id: string
  price: number
  sideDishes: string | null
  menuItem: {
    id: string
    name: string
  }
}

export type MenuOfDayResponse = {
  id: string
  date: string
  isPublished: boolean
  isLocked: boolean
  items: MenuOfDayItemResponse[]
}

export type PrefillItem = {
  menuItemId: string
  menuItemName: string
  price: number
  sideDishes: string | null
}

export type TodayMenuResponse =
  | { status: 'exists'; menu: MenuOfDayResponse }
  | { status: 'prefill'; items: PrefillItem[] }

export type MenuItemCatalogItem = {
  id: string
  name: string
  isActive: boolean
  createdAt: string
  lastUsedPrice: number | null
  lastUsedSideDishes: string | null
}

export type TodayOrderItem = {
  id: string
  quantity: number
  isAutoOrder: boolean
  isPaid: boolean
  paidAt: string | null
  employee: { id: string; name: string }
  menuOfDayItem: {
    id: string
    price: number
    menuItem: { id: string; name: string }
  }
}
