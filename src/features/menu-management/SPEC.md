# SPEC: Menu Management (F3)

> Admin page for creating and managing the daily menu.
> Domain knowledge → `docs/domains/menu.md`, `docs/domains/order.md`.
> Route: `/admin/menu`
>
> ⚠️ **Latency note:** The app runs on Supabase free tier with 3–4s API latency. All menu editing must happen in the Zustand store first. DB writes happen only on explicit "Đăng thực đơn" or "Lưu thay đổi" actions — never per row edit.

---

## Overview

Admin uses this page daily to:

1. View today's menu — starts empty with autocomplete suggestions loaded from history
2. Edit the menu inline (spreadsheet-style) — all changes are local, no API calls
3. Publish the menu → single DB write, Slack fires, employees can order, auto orders created
4. Lock orders when ready to send to kitchen
5. Unlock if changes are needed

**Key principle:** The table is always editable inline. There is always one empty row at the bottom. All edits are store-only until admin explicitly saves.

---

## Screens & States

### Screen 1 — Pre-publish (no MenuOfDay exists yet for today)

Shown when `GET /api/menu/today` returns `{ status: "no-menu" }`.

**Header:**
```
Thứ Tư, 04/04/2026   [Chưa đăng]   [Đăng thực đơn]
```

**Menu table — spreadsheet-style inline editing:**

```
| Tên món              | Giá        | Món ăn kèm              |       |
|----------------------|------------|-------------------------|-------|
| Cơm gà Hội An        | 45.000     | Nộm, canh bầu           | [Xóa] |
| Phở gà HN            | 45.000     | Quẩy, hoa quả           | [Xóa] |
| ________________     | _______    | _____________________   |       |  ← empty row
```

Rules:
- Table starts with just the empty row (no prefill from previous day — see Autocomplete section)
- Every cell is directly editable — click to edit, no separate "Sửa" button
- Always one empty row at the bottom
- When admin types a dish name in the empty row → a new empty row appears below it automatically
- **Auto-fill on new row:** when a new row is created (admin types in the empty row), its `price` and `sideDishes` are automatically copied from the row immediately above it. If there is no row above (first row), they default to empty. This saves repeated input since dishes on the same day usually share the same price and side dishes.
- [Xóa] button removes that row (with confirmation if the row has content)
- All changes are **store-only** — zero API calls until publish

**Publish flow:**
1. Validate: at least one row with non-empty name and price > 0 — show inline error if not
2. Confirm dialog: `"Đăng thực đơn và thông báo Slack?"`
3. `POST /api/menu/publish` with full item list — single request
4. Server atomically: creates `MenuOfDay` + all `MenuOfDayItem` records + auto orders + Slack
5. UI transitions to Screen 2

---

### Screen 2 — Published (MenuOfDay exists, isLocked = false)

**Header:**
```
Thứ Tư, 04/04/2026   [Đã đăng]   [Lưu thay đổi]   [Chốt sổ]
```

"Lưu thay đổi" button is only shown when `hasUnsavedChanges = true` in the store.

**Menu table:** same spreadsheet-style as Screen 1 — fully editable inline, empty row at bottom.

When admin makes any change (edit a cell, add a row, delete a row) → `hasUnsavedChanges = true` → "Lưu thay đổi" button appears.

**Save flow ("Lưu thay đổi"):**
1. `PATCH /api/menu/[id]/items` with full current item list — single request
2. Server diffs the submitted list against existing `MenuOfDayItem` records for this menu
3. For items being removed: **cascade delete their orders first**, then delete the item — all inside a single Prisma transaction
4. For items remaining: upsert by `(menuOfDayId, name)`
5. On success: return updated item list, frontend sets `hasUnsavedChanges = false`, button disappears

**Why cascade delete orders:** if admin removes a dish, it means the supplier is no longer serving it. Any employee orders for that dish are invalidated — the employee will see the dish gone and must re-order another dish. No 409 blocking — the delete always succeeds.

---

### Screen 3 — Locked (isLocked = true)

**Header:**
```
Thứ Tư, 04/04/2026   [Đã chốt]   [Mở lại]
```

**Menu table:** read-only. No empty row. No [Xóa] buttons. Cells are not editable.

**Kitchen summary box:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━
Tóm tắt gửi bếp
━━━━━━━━━━━━━━━━━━━━━━━━━━
Cơm gà Hội An       x 5
Cơm thịt kho tàu    x 3
Phở gà HN           x 2
━━━━━━━━━━━━━━━━━━━━━━━━━━
Tổng: 10 suất
```

"Sao chép" button → copies summary text to clipboard.
Computed from all orders for today grouped by dish name + summed quantity.

---

## Autocomplete Behavior

On page load, `GET /api/menu/suggestions` is called once. Response is stored in the Zustand store.

```ts
type MenuSuggestion = {
  name: string
  price: number  // from most recent occurrence in history
}
```

When admin types in the dish name cell:
- Filter suggestions client-side (case-insensitive contains match) — no additional API call
- Show dropdown with matching suggestions
- Selecting a suggestion auto-fills `name` and `price` in that row — `sideDishes` stays empty (admin fills manually each day)
- If no match → admin can type any free-text name, no problem

**`sideDishes` is intentionally NOT suggested** — side dishes change daily.

---

## Lock / Unlock Flow

**Lock ("Chốt sổ"):**
1. If `hasUnsavedChanges` → warn: `"Có thay đổi chưa lưu. Lưu trước khi chốt?"` with [Lưu và chốt] / [Hủy]
2. Confirm: `"Chốt sổ? Nhân viên sẽ không thể thay đổi đơn hàng."`
3. `POST /api/menu/[id]/lock`
4. UI transitions to Screen 3

**Unlock ("Mở lại"):**
1. Confirm: `"Mở lại để nhân viên có thể chỉnh sửa đơn hàng?"`
2. `POST /api/menu/[id]/unlock`
3. UI transitions to Screen 2

---

## User Stories

- [ ] US1: Admin opens the page and sees an empty table with one empty row ready to fill
- [ ] US2: Admin types a dish name and sees autocomplete suggestions from history
- [ ] US3: Admin selects a suggestion — name and price auto-fill, sideDishes stays empty
- [ ] US4: Admin types a dish name not in history — row is created with empty price/sideDishes
- [ ] US5: Admin edits any cell inline — no API call is made
- [ ] US6: A new empty row appears automatically when admin types in the last empty row
- [ ] US7: Admin can delete any row with the [Xóa] button
- [ ] US8: Admin cannot publish an empty menu — inline error shown
- [ ] US9: Admin publishes the menu — single API call, Slack fires, auto orders created, UI shows Published
- [ ] US10: After publish, admin can still edit the table inline — "Lưu thay đổi" button appears when changes exist
- [ ] US11: Admin saves post-publish changes — single API call, all changes applied at once
- [ ] US12: Admin removes a dish that has orders — orders for that dish are automatically deleted, dish is removed successfully
- [ ] US13: Admin locks orders — kitchen summary appears with copyable text
- [ ] US14: Admin can copy kitchen summary to clipboard
- [ ] US15: Admin can unlock orders to allow changes
- [ ] US16: Unsaved changes warning shown if admin tries to lock with pending edits

---

## API Calls

| Action | Method | Endpoint | Body |
|---|---|---|---|
| Load today's menu | GET | `/api/menu/today` | — |
| Load autocomplete suggestions | GET | `/api/menu/suggestions` | — |
| Load today's orders (for kitchen summary) | GET | `/api/orders/today` | — |
| Publish | POST | `/api/menu/publish` | `{ items: [{ name, price, sideDishes? }] }` |
| Batch save post-publish changes | PATCH | `/api/menu/[id]/items` | `{ items: [{ name, price, sideDishes? }] }` |
| Lock | POST | `/api/menu/[id]/lock` | — |
| Unlock | POST | `/api/menu/[id]/unlock` | — |

---

## Component Structure

```
features/menu-management/
├── components/
│   ├── menu-header.tsx              — Date, status badge, action buttons
│   ├── menu-table.tsx               — Spreadsheet-style table; manages empty row logic
│   ├── menu-table-row.tsx           — Single editable row (name, price, sideDishes, delete)
│   ├── menu-table-row-readonly.tsx  — Read-only row for locked state
│   ├── menu-name-cell.tsx           — Name input with autocomplete dropdown
│   ├── menu-publish-button.tsx      — "Đăng thực đơn" with confirm dialog
│   ├── menu-save-button.tsx         — "Lưu thay đổi" — only shown when hasUnsavedChanges
│   ├── menu-lock-button.tsx         — "Chốt sổ" with unsaved-changes guard + confirm dialog
│   ├── menu-unlock-button.tsx       — "Mở lại" with confirm dialog
│   ├── menu-kitchen-summary.tsx     — Aggregated order summary + copy button
│   └── menu-status-badge.tsx        — Chưa đăng / Đã đăng / Đã chốt badge
├── hooks/
│   ├── use-today-menu.ts            — GET /api/menu/today
│   ├── use-menu-suggestions.ts      — GET /api/menu/suggestions
│   ├── use-publish-menu.ts          — POST /api/menu/publish
│   ├── use-save-menu-items.ts       — PATCH /api/menu/[id]/items
│   ├── use-lock-menu.ts             — POST /api/menu/[id]/lock
│   ├── use-unlock-menu.ts           — POST /api/menu/[id]/unlock
│   └── use-today-orders.ts          — GET /api/orders/today (for kitchen summary)
├── stores/
│   └── menu-draft.store.ts          — All local editing state; see store shape below
└── index.ts
```

---

## State Management (`menu-draft.store.ts`)

```ts
type DraftItem = {
  tempId: string        // client-only, used as React key, never sent to server
  name: string
  price: number         // integer VND (e.g. 45000), displayed as "45.000đ"
  sideDishes: string    // empty string means no side dishes
}

type MenuSuggestion = {
  name: string
  price: number
}

type MenuDraftStore = {
  items: DraftItem[]
  hasUnsavedChanges: boolean

  suggestions: MenuSuggestion[]
  setSuggestions: (suggestions: MenuSuggestion[]) => void

  setItems: (items: DraftItem[]) => void          // called after publish/save to sync with DB
  updateItem: (tempId: string, patch: Partial<Omit<DraftItem, 'tempId'>>) => void
  removeItem: (tempId: string) => void

  markSaved: () => void   // sets hasUnsavedChanges = false
  reset: () => void       // clears items, resets hasUnsavedChanges
}
```

**Empty row:** rendered by `menu-table.tsx` — always appends one virtual empty row to the displayed list. When the user types a name into the empty row, the component:
1. Calls `updateItem` on that row with `{ name, price: lastItem.price, sideDishes: lastItem.sideDishes }` — copying price and sideDishes from the last real item above
2. Generates a new empty row below

This is purely rendering logic, not store state. The auto-fill values come from the last item in `store.items` at the moment the name is first typed.

---

## Notes

- **Price input:** integer only, no decimals — display as `45.000đ` but store as `45000`; use a numeric input that strips non-digit characters
- **Inline confirm for delete:** clicking [Xóa] on a row with content → button turns red + text changes to "Chắc chắn?" for 3s → second click confirms; click elsewhere cancels
- **Kitchen summary format:** plain text, space-aligned — optimized for pasting into Zalo/Messenger to send to restaurant
- **Tab navigation:** pressing Tab in a row should move focus to the next cell, then to the next row's first cell
- **`sideDishes` is intentionally empty after autocomplete** — never prefill from history; admin fills daily