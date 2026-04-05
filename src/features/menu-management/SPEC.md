# SPEC: Menu Management (F3)

> Admin page for creating and managing the daily menu.
> Domain knowledge → `docs/domains/menu.md`, `docs/domains/order.md`.
> Route: `/admin/menu`

---

## Overview

Admin uses this page daily to:

1. Review today's menu — pre-populated from the previous day automatically
2. Add, edit, or remove meal portions if needed
3. Publish the menu → Slack fires, employees can order, auto orders are created
4. Lock orders when ready to send to kitchen (chốt sổ)
5. Unlock if changes are needed

**Key principle:** nothing is written to DB until admin clicks "Đăng thực đơn". The UI is pre-populated from the previous day's menu and admin edits it freely before publishing.

---

## Screens & States

### Screen 1 — Pre-publish (no MenuOfDay exists yet for today)

Shown when `GET /api/menu/today` returns `{ status: "prefill", items: [...] }`.

**Header:**
- Date: `Thứ Tư, 04/04/2026`
- Status badge: `Chưa đăng` (grey)
- "Đăng thực đơn" button (primary)

**Meal portions list:**

Pre-populated from previous day's items. Visually identical to an editable menu — admin may not even notice the difference.

| Món | Giá | Món ăn kèm | |
|---|---|---|---|
| Cơm gà Hội An | 45.000đ | Nộm, canh bầu | [Sửa] [Xóa] |
| Phở gà HN | 45.000đ | Quẩy, hoa quả | [Sửa] [Xóa] |

- All edits (add/edit/remove) are **UI state only** — no API calls until publish
- If `prefill.items` is empty (no previous menu) → show empty list with only the add form

**Add dish form (always visible below the list):**

```
[Autocomplete: tên món...] [Giá] [Món ăn kèm] [Thêm]
```

- Autocomplete searches active `MenuItem` catalog (case-insensitive)
- Selecting existing dish → auto-fills `price` and `sideDishes` from `MenuItem.lastUsed`
- Typing new name with no match → treated as new dish, fields left empty
- On "Thêm": adds to UI list only — no API call

---

### Screen 2 — Published (MenuOfDay exists, isLocked = false)

**Header:**
- Status badge: `Đã đăng` (green)
- "Chốt sổ" button (primary)

**Meal portions list:** editable — add/edit/remove each call API immediately (no buffering).

- **Sửa**: inline edit → `PATCH /api/menu/[id]` with `{ action: "edit", ... }`
- **Xóa**: confirm → `PATCH /api/menu/[id]` with `{ action: "remove", ... }` — blocked if item has orders
- **Add form**: same as Screen 1 but each submit calls `PATCH /api/menu/[id]` with `{ action: "add", ... }` immediately

---

### Screen 3 — Locked (isLocked = true)

**Header:**
- Status badge: `Đã chốt` (red)
- "Mở lại" button (secondary)

**Meal portions list:** read-only, no edit/delete actions.

**Kitchen summary box:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━
Tóm tắt đơn hàng hôm nay
━━━━━━━━━━━━━━━━━━━━━━━━━━
Cơm gà Hội An       x 5
Cơm thịt kho tàu    x 3
Phở gà HN           x 2
━━━━━━━━━━━━━━━━━━━━━━━━━━
Tổng: 10 suất
```

- "Sao chép" button → copies summary text to clipboard
- Computed from all orders for today grouped by dish name + summed quantity

---

## Publish Flow (admin clicks "Đăng thực đơn")

1. Validate: list must have at least one item — show inline error if empty
2. Confirm dialog: `"Đăng thực đơn và thông báo Slack?"` → confirm
3. `POST /api/menu/publish` with full item list from UI state
4. Server atomically:
   - Creates `MenuOfDay` for today
   - Looks up or creates `MenuItem` for each item name
   - Creates all `MenuOfDayItem` records
   - Sets `isPublished = true`
   - Creates auto orders for eligible employees
   - Posts Slack channel message
   - Sends Slack DMs to auto-order employees
5. UI transitions to Screen 2

---

## Lock Flow (admin clicks "Chốt sổ")

1. Confirm: `"Chốt sổ? Nhân viên sẽ không thể thay đổi đơn hàng."` → `POST /api/menu/[id]/lock`
2. UI transitions to Screen 3 → kitchen summary box appears

---

## Unlock Flow (admin clicks "Mở lại")

1. Confirm: `"Mở lại để nhân viên có thể chỉnh sửa đơn hàng?"` → `POST /api/menu/[id]/unlock`
2. UI transitions to Screen 2

---

## User Stories

- [ ] US1: Admin opens the page and sees today's menu pre-populated from the previous day
- [ ] US2: Admin sees an empty list when no previous menu exists
- [ ] US3: Admin can add a meal portion by selecting an existing dish — price and side dishes auto-filled
- [ ] US4: Admin can add a meal portion by typing a new dish name
- [ ] US5: Admin can edit price or side dishes of a meal portion
- [ ] US6: Admin can remove a meal portion from the list
- [ ] US7: Admin cannot publish an empty menu
- [ ] US8: Admin publishes the menu — Slack notifications fire, auto orders created, UI shows Published state
- [ ] US9: After publish, admin can still add/edit/remove meal portions via API
- [ ] US10: Admin cannot delete a published meal portion that has existing orders
- [ ] US11: Admin locks orders — kitchen summary appears with copyable text
- [ ] US12: Admin can copy kitchen summary to clipboard
- [ ] US13: Admin can unlock orders to allow changes

---

## API Calls

| Action | Method | Endpoint | Body |
|---|---|---|---|
| Load today's menu | GET | `/api/menu/today` | — |
| Load MenuItem catalog | GET | `/api/menu-items` | — |
| Publish with items | POST | `/api/menu/publish` | `{ items: [{ menuItemName, price, sideDishes? }] }` |
| Add item (post-publish) | PATCH | `/api/menu/[id]` | `{ action: "add", menuItemName, price, sideDishes? }` |
| Edit item | PATCH | `/api/menu/[id]` | `{ action: "edit", menuOfDayItemId, price?, sideDishes? }` |
| Remove item | PATCH | `/api/menu/[id]` | `{ action: "remove", menuOfDayItemId }` |
| Lock | POST | `/api/menu/[id]/lock` | — |
| Unlock | POST | `/api/menu/[id]/unlock` | — |
| Load today's orders | GET | `/api/orders/today` | — |

---

## Component Structure

```
features/menu-management/
├── components/
│   ├── menu-header.tsx              — Date, status badge, action buttons
│   ├── menu-item-list.tsx           — List of items (UI state pre-publish, DB post-publish)
│   ├── menu-item-row.tsx            — Single row: name, price, sideDishes, edit/delete
│   ├── menu-item-row-edit.tsx       — Inline edit form for a row
│   ├── menu-item-add-form.tsx       — Autocomplete + price + sideDishes + Thêm button
│   ├── menu-publish-button.tsx      — "Đăng thực đơn" with confirm dialog
│   ├── menu-lock-button.tsx         — "Chốt sổ" with confirm dialog
│   ├── menu-unlock-button.tsx       — "Mở lại" with confirm dialog
│   ├── menu-kitchen-summary.tsx     — Aggregated order summary + copy button
│   └── menu-status-badge.tsx        — Chưa đăng / Đã đăng / Đã chốt badge
├── hooks/
│   ├── use-today-menu.ts            — GET /api/menu/today
│   ├── use-menu-items.ts            — GET /api/menu-items (for autocomplete)
│   ├── use-publish-menu.ts          — POST /api/menu/publish
│   ├── use-update-menu.ts           — PATCH /api/menu/[id]
│   ├── use-lock-menu.ts             — POST /api/menu/[id]/lock
│   ├── use-unlock-menu.ts           — POST /api/menu/[id]/unlock
│   └── use-today-orders.ts          — GET /api/orders/today (for kitchen summary)
├── stores/
│   └── menu-draft.store.ts          — UI-only state: draft item list before publish
└── index.ts
```

---

## State Management

Before publish, the item list lives in `menu-draft.store.ts` (Zustand) — not in the DB.

```ts
type DraftItem = {
  tempId: string          // client-side only, used as React key
  menuItemName: string
  price: number
  sideDishes: string | null
}

type MenuDraftStore = {
  items: DraftItem[]
  setItems: (items: DraftItem[]) => void   // called on page load with prefill data
  addItem: (item: Omit<DraftItem, "tempId">) => void
  editItem: (tempId: string, patch: Partial<DraftItem>) => void
  removeItem: (tempId: string) => void
  reset: () => void                        // called after successful publish
}
```

After publish, all mutations go directly to API — draft store is no longer used.

---

## Notes

- **Autocomplete:** show suggestions after 1 character typed; if no match → show option `"Thêm món mới: {name}"` at bottom of list
- **Confirm dialogs:** inline confirmation (button turns red + "Chắc chắn?") rather than modal — keeps flow fast for daily use
- **Kitchen summary format:** plain text, tab-aligned — optimized for pasting into Zalo/Messenger to send to restaurant
- **Price input:** integer only, no decimals — display as `45.000đ` but store as `45000`
- **`MenuItem.lastUsed`** fields (`lastUsedPrice`, `lastUsedSideDishes`) are included in `GET /api/menu-items` response to enable auto-fill without extra API calls