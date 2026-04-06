Read CLAUDE.md fully, then read BIG_UPDATE.md fully before doing anything else.

You are applying a breaking schema change to the Dat Com RDL project. Follow BIG_UPDATE.md as your primary guide. Complete all steps below in order. Run `pnpm type-check` after each major step and fix all errors before proceeding.

---

## Step 1 — Update Prisma schema

In `prisma/schema.prisma`:
- Remove the `MenuItem` model entirely
- Remove `menuItemId` field and the `menuItem` relation from `MenuOfDayItem`
- Add `name String` field directly to `MenuOfDayItem`
- Add `@@unique([menuOfDayId, name])` constraint to `MenuOfDayItem`
- Verify `Order` still references `MenuOfDayItem` by id — no change needed there

Run `pnpm db:migrate` with migration name `remove_menu_item_flatten_menu_of_day_item`.

---

## Step 2 — Delete removed feature and routes

Delete these paths entirely:
- `src/features/menu-item-management/` (entire folder)
- `src/app/admin/menu-items/` (entire folder)
- `src/app/api/menu-items/` (entire folder)

---

## Step 3 — Add new API endpoint: suggestions

Create `src/app/api/menu/suggestions/route.ts` — GET handler.

Logic:
- Query all `MenuOfDayItem` records, ordered by `menuOfDay.date DESC`
- Deduplicate by `name` — keep the first occurrence (most recent date) of each name
- Return `{ suggestions: { name: string, price: number }[] }` sorted alphabetically by name
- No auth, no query params needed

---

## Step 4 — Update existing menu API routes

`POST /api/menu/publish` (`src/app/api/menu/publish/route.ts`):
- Accept body: `{ items: { name: string, price: number, sideDishes?: string }[] }`
- Remove any reference to `menuItemId` or `MenuItem` lookups
- Create `MenuOfDayItem` records with `name` field directly
- Keep all existing logic: atomic transaction, auto orders, Slack

`PATCH /api/menu/[id]/items` (`src/app/api/menu/[id]/items/route.ts`):
- Accept body: `{ items: { name: string, price: number, sideDishes?: string }[] }`
- Server logic: fetch all existing `MenuOfDayItem` for this menu
  - Items in DB but not in submitted list → attempt delete
    - If any have orders → return 409 `{ error: "blocked", blockedNames: string[] }`
    - If no orders → delete
  - Items in submitted list → upsert by `(menuOfDayId, name)`
- All in a single Prisma transaction
- Only allowed when `isPublished=true` and `isLocked=false`

---

## Step 5 — Update domain types

In `src/domains/menu/types/`:
- Remove any `MenuItem` type definitions
- Update `MenuOfDayItem` type: replace `menuItemId + menuItem` with `name: string`
- Add `MenuSuggestion` type: `{ name: string, price: number }`
- Update all Zod schemas accordingly

Run `pnpm type-check` and fix all errors.

---

## Step 6 — Update F3 feature: menu-management

Read `src/features/menu-management/SPEC.md` fully before starting this step.

**Store (`src/features/menu-management/stores/menu-draft.store.ts`):**
```ts
type DraftItem = {
  tempId: string       // client-only key for React, never sent to server
  name: string
  price: number        // integer VND e.g. 45000
  sideDishes: string   // empty string = no side dishes
}

type MenuDraftStore = {
  items: DraftItem[]
  hasUnsavedChanges: boolean
  suggestions: MenuSuggestion[]
  setSuggestions: (suggestions: MenuSuggestion[]) => void
  setItems: (items: DraftItem[]) => void
  updateItem: (tempId: string, patch: Partial<Omit<DraftItem, 'tempId'>>) => void
  removeItem: (tempId: string) => void
  markSaved: () => void
  reset: () => void
}
```

**Hooks:**
- `use-menu-suggestions.ts` — GET `/api/menu/suggestions`, stores result via `setSuggestions`
- `use-publish-menu.ts` — POST `/api/menu/publish` with `{ items }` from store
- `use-save-menu-items.ts` — PATCH `/api/menu/[id]/items` with `{ items }` from store

**Components:**

`menu-table.tsx` — spreadsheet-style table:
- Renders `store.items` plus one empty `DraftItem` appended at the end (never stored in Zustand)
- When admin types in the name cell of the empty row → call `store.updateItem` → component detects the last real item now has a name → appends a new empty row
- Each real row shows [Xóa] button with double-confirm: first click turns button red + shows "Chắc chắn?", second click calls `store.removeItem`, clicking elsewhere resets

`menu-name-cell.tsx` — name input with autocomplete:
- On focus/change → filter `store.suggestions` client-side (case-insensitive contains)
- Show dropdown of matches
- Selecting a suggestion → calls `updateItem` with `{ name, price }` — sideDishes stays untouched
- No API call on filter

`menu-header.tsx`:
- Pre-publish state: date + [Chưa đăng] badge + [Đăng thực đơn] button
- Published state: date + [Đã đăng] badge + [Lưu thay đổi] button (only when `hasUnsavedChanges`) + [Chốt sổ] button
- Locked state: date + [Đã chốt] badge + [Mở lại] button

`menu-lock-button.tsx`:
- If `hasUnsavedChanges` → show warning dialog with [Lưu và chốt] / [Hủy] options
- Otherwise → confirm dialog → call lock mutation

All other components per SPEC component structure.

---

## Step 7 — Update any other features that reference MenuItem

Search the codebase for any remaining references to:
- `MenuItem`
- `menuItemId`
- `menu-item-management`
- `/admin/menu-items`
- `/api/menu-items`

Fix or remove each one. Run `pnpm type-check` to confirm zero errors.

---

## Step 8 — Final check

- `pnpm type-check` — zero errors
- `pnpm lint` — zero errors
- Confirm `BIG_UPDATE.md` principles are all respected:
  - No API call per edit action anywhere in menu management
  - No `MenuItem` references anywhere
  - Autocomplete filters client-side from store, no extra requests
  - Post-publish edits go through single PATCH, not per-row requests