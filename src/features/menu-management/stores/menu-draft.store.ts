import { create } from 'zustand';

import { type MenuSuggestion } from '@/domains/menu';

import { type DraftExternalDish, type DraftItem } from '../types/menu-management.type';

let tempIdCounter = 0;

function generateTempId(): string {
  return `ext-${++tempIdCounter}-${Date.now()}`;
}

type MenuDraftStore = {
  items: DraftItem[];
  hasUnsavedChanges: boolean;
  suggestions: MenuSuggestion[];
  externalDishes: DraftExternalDish[];

  setSuggestions: (suggestions: MenuSuggestion[]) => void;
  setItems: (items: DraftItem[]) => void;
  updateItem: (tempId: string, patch: Partial<Omit<DraftItem, 'tempId'>>) => void;
  removeItem: (tempId: string) => void;
  markSaved: () => void;
  reset: () => void;

  addExternalDish: (dish: Omit<DraftExternalDish, 'tempId'>) => void;
  removeExternalDish: (tempId: string) => void;
  setExternalDishes: (dishes: DraftExternalDish[]) => void;
};

const initialState = {
  items: [] as DraftItem[],
  hasUnsavedChanges: false,
  suggestions: [] as MenuSuggestion[],
  externalDishes: [] as DraftExternalDish[],
};

export const useMenuDraftStore = create<MenuDraftStore>((set) => ({
  ...initialState,

  setSuggestions: (suggestions) => set({ suggestions }),

  setItems: (items) =>
    set((state) => ({
      items,
      hasUnsavedChanges: state.items.length > 0,
    })),

  updateItem: (tempId, patch) =>
    set((state) => ({
      items: state.items.map((item) => (item.tempId === tempId ? { ...item, ...patch } : item)),
      hasUnsavedChanges: true,
    })),

  removeItem: (tempId) =>
    set((state) => ({
      items: state.items.filter((item) => item.tempId !== tempId),
      hasUnsavedChanges: true,
    })),

  markSaved: () => set({ hasUnsavedChanges: false }),

  reset: () => set(initialState),

  addExternalDish: (dish) =>
    set((state) => ({
      externalDishes: [...state.externalDishes, { ...dish, tempId: generateTempId() }],
    })),

  removeExternalDish: (tempId) =>
    set((state) => ({
      externalDishes: state.externalDishes.filter((d) => d.tempId !== tempId),
    })),

  setExternalDishes: (dishes) => set({ externalDishes: dishes }),
}));
