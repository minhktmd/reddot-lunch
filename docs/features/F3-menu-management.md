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
3. Add/remove external dish links (Grab, ShopeeFood, etc.) — available from Screen 1, store-buffered before publish, live API calls post-publish
4. Publish the menu → single DB write, Slack fires, employees can order, auto orders created
5. Lock orders when ready to send to kitchen
6. Unlock if changes are needed

**Key principles:**
- The menu items table is always editable inline with one empty row at the bottom. All item edits are store-only until admin explicitly saves.
- The external dishes section is visible and editable on **all screens including Screen 1** — admin can add external dish links before publishing. Pre-publish edits are store-buffered and sent with the publish request. Post-publish edits write directly to the DB.
- A menu can be published with **only external dishes and no standard items** — valid for days when the whole office orders externally.

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
- [Xóa] button removes that row (with confirmation if the row has content)
- All changes are **store-only** — zero API calls until publish

**External dishes section** — below the menu table, always visible:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Món ăn ngoài
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

| Tên món                        | Link đặt              |        |
|--------------------------------|-----------------------|--------|
| Bún sườn chua — Trần Huy Liệu  | grab.onelink.me/...   | [Xóa]  |

[Tên món ________________]  [Link đặt ________________]  [Thêm]
```

Rules:
- Section is visible on Screen 1 — admin can add external dishes before publishing
- [Thêm] → validates fields → adds item to the **store** (no API call yet)
- [Xóa] → removes from store immediately (no API call)
- All changes are **store-only** — sent to server as part of the publish request

**Publish flow:**
1. Validate: at least one valid standard dish (non-empty name + price > 0) **OR** at least one external dish — show inline error `"Thêm ít nhất một món ăn hoặc một món ăn ngoài trước khi đăng"` if both are empty
2. Confirm dialog: `"Đăng thực đơn và thông báo Slack?"`
3. `POST /api/menu/publish` with `{ items, externalDishes }` — single request
4. Server atomically: creates `MenuOfDay` + all `MenuOfDayItem` records + stores `externalDishes` + auto orders + Slack
5. UI transitions to Screen 2

---

### Screen 2 — Published (MenuOfDay exists, isLocked = false)

**Header:**
```
Thứ Tư, 04/04/2026   [Đã đăng]   [Lưu thay đổi]   [Chốt sổ]
```

"Lưu thay đổi" button is only shown when `hasUnsavedChanges = true` in the store (applies to standard items only).

**Menu table:** same spreadsheet-style as Screen 1 — fully editable inline, empty row at bottom.

When admin makes any change to standard items (edit a cell, add a row, delete a row) → `hasUnsavedChanges = true` → "Lưu thay đổi" button appears.

**External dishes section:** fully editable. Changes now write directly to the DB (not store-buffered):
- [Thêm] → validates → `PATCH /api/menu/[id]/external-dishes` with current list + new item → list updates on success
- [Xóa] → inline confirm (3s red pattern) → `PATCH /api/menu/[id]/external-dishes` with item removed

**Save flow for standard items ("Lưu thay đổi"):**
1. `PATCH /api/menu/[id]/items` with full current item list — single request
2. Server diffs: cascade-deletes removed items (along with their orders and ledger entries), upserts remaining
3. On success: `hasUnsavedChanges = false`, button disappears

---

### Screen 3 — Locked (isLocked = true)

**Header:**
```
Thứ Tư, 04/04/2026   [Đã chốt]   [Mở lại]
```

**Menu table:** read-only. No empty row. No [Xóa] buttons. Cells are not editable.

**External dishes section:** read-only. No add form. No [Xóa] buttons. Links are still clickable.

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

"Sao chép" button → copies summary text to clipboard. Only shown when standard items exist (external-dishes-only days have no kitchen summary to copy).

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
- [x] US8: Admin cannot publish when both standard items and external dishes are empty — inline error shown
- [x] US9: Admin publishes with only standard items — single API call, Slack fires, auto orders created
- [x] US10: Admin publishes with only external dishes and no standard items — valid, publishes successfully
- [x] US11: Admin publishes with both standard items and external dishes — all sent in one request
- [x] US12: After publish, admin can still edit the standard items table — "Lưu thay đổi" button appears when changes exist
- [x] US13: Admin saves post-publish item changes — single API call, all changes applied at once
- [x] US14: Admin cannot remove a dish that already has orders — error toast shows blocked dish names
- [x] US15: Admin locks orders — kitchen summary appears with copyable text
- [x] US16: Admin can copy kitchen summary to clipboard
- [x] US17: Admin can unlock orders to allow changes
- [x] US18: Unsaved changes warning shown if admin tries to lock with pending edits
- [x] US19: Admin can add an external dish link (name + URL) on Screen 1 before publishing — stored in draft
- [x] US20: Admin can add an external dish link on Screen 2 after publishing — saved immediately to DB
- [x] US21: Admin can remove an external dish link on Screen 2 — saved immediately to DB
- [x] US22: External dishes section is read-only when orders are locked (Screen 3)
- [x] US23: External dish links are clickable on all screens including Screen 3

---

## API Calls

| Action | Method | Endpoint | Body |
|---|---|---|---|
| Load today's menu | GET | `/api/menu/today` | — |
| Load autocomplete suggestions | GET | `/api/menu/suggestions` | — |
| Load today's orders (for kitchen summary) | GET | `/api/orders/today` | — |
| Publish | POST | `/api/menu/publish` | `{ items: [{ name, price, sideDishes? }], externalDishes: [{ name, orderUrl }] }` |
| Batch save post-publish item changes | PATCH | `/api/menu/[id]/items` | `{ items: [{ name, price, sideDishes? }] }` |
| Save external dish changes | PATCH | `/api/menu/[id]/external-dishes` | `{ externalDishes: [{ name, orderUrl }] }` |
| Lock | POST | `/api/menu/[id]/lock` | — |
| Unlock | POST | `/api/menu/[id]/unlock` | — |

### PATCH /api/menu/[id]/external-dishes

- Accepts the **full array** — replaces `MenuOfDay.externalDishes` entirely
- Validates each item: `name` non-empty string, `orderUrl` valid URL
- Guarded: returns `403` if `isLocked = true`
- Returns updated `{ externalDishes: ExternalDishItem[] }`

### POST /api/menu/publish — updated body

```ts
type PublishMenuBody = {
  items: { name: string; price: number; sideDishes?: string }[]
  externalDishes: { name: string; orderUrl: string }[]
}
```

Server validation: `items.length > 0 || externalDishes.length > 0` — return `400` if both empty.

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
│   ├── menu-kitchen-summary.tsx     — Aggregated order summary + copy button (hidden on external-only days)
│   ├── menu-status-badge.tsx        — Chưa đăng / Đã đăng / Đã chốt badge
│   ├── menu-external-section.tsx    — Container: heading + list + add form; read-only when locked; always visible
│   ├── menu-external-row.tsx        — Single external dish row: name + URL chip + delete button
│   └── menu-external-add-form.tsx   — Inline add form: name input + URL input + submit button
├── hooks/
│   ├── use-today-menu.ts            — GET /api/menu/today
│   ├── use-menu-suggestions.ts      — GET /api/menu/suggestions
│   ├── use-publish-menu.ts          — POST /api/menu/publish
│   ├── use-save-menu-items.ts       — PATCH /api/menu/[id]/items
│   ├── use-save-external-dishes.ts  — PATCH /api/menu/[id]/external-dishes (post-publish only)
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

type DraftExternalDish = {
  tempId: string        // client-only, used as React key, never sent to server
  name: string
  orderUrl: string
}

type MenuSuggestion = {
  name: string
  price: number
}

type MenuDraftStore = {
  // Standard items
  items: DraftItem[]
  hasUnsavedChanges: boolean
  setItems: (items: DraftItem[]) => void
  updateItem: (tempId: string, patch: Partial<Omit<DraftItem, 'tempId'>>) => void
  removeItem: (tempId: string) => void

  // External dishes (pre-publish only — post-publish writes directly to server)
  externalDishes: DraftExternalDish[]
  addExternalDish: (dish: Omit<DraftExternalDish, 'tempId'>) => void
  removeExternalDish: (tempId: string) => void
  setExternalDishes: (dishes: DraftExternalDish[]) => void  // called after publish to clear draft

  // Autocomplete suggestions
  suggestions: MenuSuggestion[]
  setSuggestions: (suggestions: MenuSuggestion[]) => void

  markSaved: () => void   // sets hasUnsavedChanges = false
  reset: () => void       // clears items + externalDishes, resets hasUnsavedChanges
}
```

**Pre-publish:** both `items` and `externalDishes` in the store are sent together in `POST /api/menu/publish`.

**Post-publish:** `items` remains store-buffered (saved via "Lưu thay đổi"). `externalDishes` in the store is no longer used — the live list comes from the TanStack Query cache (`use-today-menu`), and mutations call `PATCH /api/menu/[id]/external-dishes` directly.

**Empty row:** rendered by `menu-table.tsx` — always appends one virtual empty row to the displayed list. Purely rendering logic, not store state.

---

## Notes

- **Price input:** integer only, no decimals — display as `45.000đ` but store as `45000`
- **Inline confirm for delete:** clicking [Xóa] on a row with content → button turns red + text changes to "Chắc chắn?" for 3s → second click confirms; click elsewhere cancels
- **Kitchen summary:** only rendered when today has at least one standard `MenuOfDayItem`; hidden on external-dishes-only days
- **Tab navigation:** pressing Tab in a row should move focus to the next cell, then to the next row's first cell
- **`sideDishes` is intentionally empty after autocomplete** — never prefill from history; admin fills daily
- **External dish URL display:** truncate long URLs in the table with ellipsis + show full URL on hover (tooltip)
- **External dish URL validation:** validate with `z.string().url()` on both client (form) and server (API route)
- **External dishes are per-day** — never pre-filled from previous day; admin adds them fresh each time