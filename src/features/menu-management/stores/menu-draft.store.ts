import { create } from 'zustand'

import { type DraftItem } from '../types/menu-management.type'

type MenuDraftStore = {
  items: DraftItem[]
  publishError: string
  setItems: (items: DraftItem[]) => void
  addItem: (item: Omit<DraftItem, 'tempId'>) => void
  editItem: (tempId: string, patch: Partial<Omit<DraftItem, 'tempId'>>) => void
  removeItem: (tempId: string) => void
  setPublishError: (error: string) => void
  reset: () => void
}

const initialState = {
  items: [] as DraftItem[],
  publishError: '',
}

let tempIdCounter = 0

export const useMenuDraftStore = create<MenuDraftStore>((set) => ({
  ...initialState,

  setItems: (items) => set({ items }),

  addItem: (item) =>
    set((state) => ({
      items: [
        ...state.items,
        { ...item, tempId: `draft-${++tempIdCounter}-${Date.now()}` },
      ],
      publishError: '',
    })),

  editItem: (tempId, patch) =>
    set((state) => ({
      items: state.items.map((item) => (item.tempId === tempId ? { ...item, ...patch } : item)),
    })),

  removeItem: (tempId) =>
    set((state) => ({
      items: state.items.filter((item) => item.tempId !== tempId),
    })),

  setPublishError: (publishError) => set({ publishError }),

  reset: () => set(initialState),
}))
