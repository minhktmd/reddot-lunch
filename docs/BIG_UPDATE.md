# BIG_UPDATE.md — Schema Simplification: Remove MenuItem, Flatten MenuOfDayItem

> This document describes a breaking schema change. Claude Code must read this file **before** implementing F3 (Menu Management) or any feature that touches `MenuItem` or `MenuOfDayItem`.
> After completing the changes described here, this file can be archived.

---

## Context: Why This Change

The app runs on **Supabase free tier** which has significant cold-start and connection latency — typically **3–4 seconds per API request**. Under the original design, post-publish menu editing (add/edit/remove a dish) sent one API request per action. With 3–4s latency per request, editing a 5-dish menu could take 15–20 seconds of waiting. This is unacceptable UX.

The solution is to make **all menu editing happen in the frontend store** and batch everything into the fewest possible DB round-trips. This change also simplifies the domain model by removing the `MenuItem` catalog concept entirely — admins don't think in terms of "catalog" vs "today's menu"; they just want to write dish names directly like they do in Google Sheets.

**Keep this latency context in mind throughout the codebase:** prefer batch operations over sequential requests wherever possible.

---

## What Changes

### 1. Remove `MenuItem` entity entirely

`MenuItem` was a reusable dish catalog. It is removed. No more F8 (MenuItem Management) page.

**Delete:**
- `src/features/menu-item-management/` — entire folder
- `src/app/admin/menu-items/page.tsx`
- `src/app/api/menu-items/` — all route handlers
- All references to `MenuItem` in domain docs and OVERVIEW

### 2. Flatten `MenuOfDayItem` — dish name stored directly

`MenuOfDayItem` no longer references a `MenuItem` FK. The dish name is stored as a plain string field directly on `MenuOfDayItem`.

**Old schema:**
```prisma
model MenuOfDayItem {
  id          String    @id @default(cuid())
  menuOfDayId String
  menuOfDay   MenuOfDay @relation(...)
  menuItemId  String    // ← FK to MenuItem
  menuItem    MenuItem  @relation(...)
  price       Int
  sideDishes  String?
  orders      Order[]
}
```

**New schema:**
```prisma
model MenuOfDayItem {
  id          String    @id @default(cuid())
  menuOfDayId String
  menuOfDay   MenuOfDay @relation(fields: [menuOfDayId], references: [id], onDelete: Cascade)
  name        String    // ← dish name stored directly, no FK
  price       Int       // VND integer
  sideDishes  String?
  orders      Order[]

  @@unique([menuOfDayId, name])  // one dish name per day
  @@map("menu_of_day_items")
}
```

**`Order` is unchanged** — still FK to `MenuOfDayItem.id`. No migration needed for orders.

---

## New Autocomplete Behavior (replaces MenuItem catalog)

Since there is no longer a `MenuItem` catalog, autocomplete in the menu editor works differently:

**Data source:** `GET /api/menu/suggestions` — queries all past `MenuOfDayItem` records, deduplicates by `name` (keeping the most recent occurrence), returns `{ name, price }[]` sorted alphabetically.

**`sideDishes` is NOT included in suggestions** — side dishes change daily, admin fills them in fresh each day.

**Frontend flow:**
1. On page load, fetch suggestions into the Zustand store (`useMenuDraftStore`)
2. When admin types in the dish name cell, filter suggestions client-side (no extra API call)
3. Selecting a suggestion auto-fills `name` and `price` — `sideDishes` stays empty
4. Typing a name not in suggestions = new dish, no problem

**API endpoint:**
```
GET /api/menu/suggestions   — returns deduplicated dish names + prices from history
```

Response shape:
```ts
type MenuSuggestion = {
  name: string
  price: number  // from most recent occurrence
}
```

---

## New Menu Editing UX (spreadsheet-style, all in store)

This replaces the form-above-table pattern from F3 SPEC.

### Pre-publish (draft state)

The page loads with an **empty table** plus a single empty row at the bottom.

```
| Tên món          | Giá       | Món ăn kèm        |         |
|------------------|-----------|-------------------|---------|
| Cơm gà Hội An    | 45.000    | Nộm, canh bầu     | [Xóa]   |
| Phở gà HN        | 45.000    | Quẩy, hoa quả     | [Xóa]   |
| _______________  | _______   | _______________   |         |  ← empty row, always present
```

Rules for the empty row:
- Always one empty row at the bottom
- When admin types any content in the `name` field of the empty row → a new empty row appears below it
- The row with content becomes a normal editable row
- Admin can delete any row with the [Xóa] button
- All changes are **store-only** — zero API calls

When admin clicks "Đăng thực đơn":
- Validate: at least one row with a non-empty name and price > 0
- Confirm dialog
- `POST /api/menu/publish` with all rows — single DB transaction creates `MenuOfDay` + all `MenuOfDayItem` records + auto orders + Slack

### Post-publish (published, not locked)

Same spreadsheet table, same empty row at bottom, same inline editing.

**Difference:** a **"Lưu thay đổi"** button appears in the header when the store has unsaved changes.

```
Thứ Tư, 04/04/2026  •  Đã đăng  •  [Lưu thay đổi]  [Chốt sổ]
```

When admin clicks "Lưu thay đổi":
- `PATCH /api/menu/[id]/items` with the full current item list — server diffs against existing DB records and applies changes (upsert + delete) in one transaction
- Button disappears after save

**Why not save per-cell?** Each API call costs 3–4s on Supabase free tier. Batch save = 1 round-trip regardless of how many changes were made.

### Locked state

Table is read-only. No empty row. No edit/delete controls. Kitchen summary box appears.

---

## API Changes

### Removed endpoints
```
GET    /api/menu-items              — removed (no MenuItem catalog)
POST   /api/menu-items              — removed
PATCH  /api/menu-items/[id]         — removed
```

### Added endpoint
```
GET    /api/menu/suggestions        — deduplicated dish names + prices from history
```

### Changed endpoint
```
# Publish now accepts full item list (unchanged from before, but name field replaces menuItemName)
POST   /api/menu/publish
Body: { items: [{ name: string, price: number, sideDishes?: string }] }

# Post-publish batch update (replaces per-action PATCH)
PATCH  /api/menu/[id]/items
Body: { items: [{ name: string, price: number, sideDishes?: string }] }
# Server: delete all existing MenuOfDayItems for this menu, recreate from submitted list
# IMPORTANT: Only allowed when isPublished=true and isLocked=false
# Orders that reference deleted MenuOfDayItems must be handled:
#   - If a MenuOfDayItem being removed has orders → block removal, return 409 with affected item names
#   - Frontend shows error toast listing which dishes cannot be removed
```

### Unchanged endpoints
```
GET    /api/menu/today              — unchanged
POST   /api/menu/[id]/lock          — unchanged
POST   /api/menu/[id]/unlock        — unchanged
```

---

## Store Changes (`menu-draft.store.ts`)

The draft store is expanded to handle both pre-publish and post-publish state:

```ts
type DraftItem = {
  tempId: string        // client-only key for React, never sent to server
  name: string
  price: number         // stored as integer VND (e.g. 45000), displayed as "45.000đ"
  sideDishes: string    // empty string = no side dishes
}

type MenuDraftStore = {
  // Draft items (pre-publish and post-publish pending changes)
  items: DraftItem[]
  hasUnsavedChanges: boolean

  // Autocomplete suggestions loaded from /api/menu/suggestions
  suggestions: MenuSuggestion[]
  setSuggestions: (suggestions: MenuSuggestion[]) => void

  // Item mutations (all local, no API calls)
  setItems: (items: DraftItem[]) => void
  updateItem: (tempId: string, patch: Partial<Omit<DraftItem, 'tempId'>>) => void
  removeItem: (tempId: string) => void

  // Called after successful publish or save
  markSaved: () => void
  reset: () => void
}
```

**Empty row management:** handled in the component layer, not the store. The component always appends one empty `DraftItem` (with empty name/price/sideDishes) to the rendered list. When the user types into it, `updateItem` is called → the item becomes "real" → component appends another empty row.

---

## Folder Changes

```
REMOVE: src/features/menu-item-management/
REMOVE: src/app/admin/menu-items/page.tsx
REMOVE: src/app/api/menu-items/

ADD:    src/app/api/menu/suggestions/route.ts
CHANGE: src/app/api/menu/[id]/items/route.ts  (new PATCH endpoint)
CHANGE: src/features/menu-management/  (new UX, updated store)
CHANGE: src/domains/menu/  (remove MenuItem references)
```

---

## Domain Doc Update Summary

`docs/domains/menu.md` must be updated to reflect:
- `MenuItem` entity removed
- `MenuOfDayItem.name` is now a direct string field
- Autocomplete sourced from historical `MenuOfDayItem` records via `/api/menu/suggestions`
- All editing is batch/store-based; never per-action API calls

---

## Prisma Migration Notes

If migrating an existing database:
1. The `menu_items` table can be dropped after migrating `menu_of_day_items.menu_item_id` → `menu_of_day_items.name`
2. The migration should populate `name` from the joined `menu_items.name` before dropping the FK
3. If starting fresh (no existing data), simply use the new schema directly

---

## Summary of Principles Going Forward

1. **Never call API per user action in menu editing** — always buffer in store, batch on explicit save/publish
2. **No MenuItem catalog** — dish names are free text stored per `MenuOfDayItem`
3. **Autocomplete = history query** — `GET /api/menu/suggestions` on page load, filter client-side
4. **Post-publish edits** — batch via `PATCH /api/menu/[id]/items`, blocked if items have orders
5. **Spreadsheet UX** — inline editing directly in the table, empty row at bottom for new entries