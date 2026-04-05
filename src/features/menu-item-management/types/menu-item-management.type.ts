import { z } from 'zod';

export const addMenuItemSchema = z.object({
  name: z.string().min(1, 'Tên món là bắt buộc'),
});

export type AddMenuItemInput = z.infer<typeof addMenuItemSchema>;

export const editMenuItemSchema = z.object({
  name: z.string().min(1, 'Tên món là bắt buộc'),
});

export type EditMenuItemInput = z.infer<typeof editMenuItemSchema>;

export type MenuItemListItem = {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
};
