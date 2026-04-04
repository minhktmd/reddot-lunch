---
name: zustand-pattern
description: Use when creating a new Zustand store for client-side state management. Provides boilerplate, rules, and persist middleware pattern.
---

## When to use

Use Zustand when state needs to be shared across components not in a direct parent-child relationship. For simple local UI state, prefer `useState`.

## Where to place

- `features/<feature>/stores/<resource>.store.ts` — feature-scoped
- `domains/<domain>/stores/<resource>.store.ts` — domain-shared
- `shared/stores/<resource>.store.ts` — global only (rare)

## Rules

- Always named export (`export const use...`) — no default exports
- Always extract `initialState` as a const — makes `reset()` reliable and DRY
- Keep stores flat — avoid deeply nested state shapes
- Actions live inside the store — never mutate state from outside
- Add `persist` middleware only when state must survive page refresh — never by default

## Boilerplate

```ts
import { create } from 'zustand'

interface <Resource>State {
  // fields
  reset: () => void
}

const initialState = {
  // fields with default values
}

export const use<Resource>Store = create<<Resource>State>(set => ({
  ...initialState,
  // actions
  reset: () => set(initialState),
}))
```

## Concrete example

```ts
// features/cart/stores/cart.store.ts
import { create } from 'zustand';

interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  reset: () => void;
}

const initialState = { items: [] as CartItem[] };

export const useCartStore = create<CartState>((set) => ({
  ...initialState,
  addItem: (item) => set((state) => ({ items: [...state.items, item] })),
  removeItem: (id) => set((state) => ({ items: state.items.filter((i) => i.id !== id) })),
  reset: () => set(initialState),
}));
```

## With persist middleware (only when needed)

```ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...initialState,
      // actions
    }),
    { name: 'settings-store' }
  )
);
```
