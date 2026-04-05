import { z } from 'zod'

export type DraftItem = {
  tempId: string
  menuItemName: string
  price: number
  sideDishes: string | null
}

export const addItemSchema = z.object({
  menuItemName: z.string().min(1, 'Tên món là bắt buộc'),
  price: z.number().int().min(1000, 'Giá tối thiểu 1.000đ'),
  sideDishes: z.string().optional(),
})

export type AddItemInput = z.infer<typeof addItemSchema>

export const editItemSchema = z.object({
  price: z.number().int().min(1000, 'Giá tối thiểu 1.000đ'),
  sideDishes: z.string().optional(),
})

export type EditItemInput = z.infer<typeof editItemSchema>

export type PublishMenuInput = {
  items: {
    menuItemName: string
    price: number
    sideDishes?: string
  }[]
}

export type UpdateMenuInput =
  | { action: 'add'; menuItemName: string; price: number; sideDishes?: string }
  | { action: 'edit'; menuOfDayItemId: string; price?: number; sideDishes?: string }
  | { action: 'remove'; menuOfDayItemId: string }
