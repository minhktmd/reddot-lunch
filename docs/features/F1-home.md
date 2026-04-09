# SPEC: Home (F1)

> Employee-facing home page. The only page most employees will ever use.
> Domain knowledge → `docs/domains/order.md`, `docs/domains/employee.md`, `docs/domains/menu.md`, `docs/domains/ledger.md`.
> Route: `/`

---

## Overview

Single page with three concerns:

1. **Name selection** — first visit only; subsequent visits skip straight to the order form
2. **Order tab** — view today's menu (standard dishes + external dish links), place/edit/cancel orders
3. **Finance tab** — view balance, top up via dynamic QR, view transaction history

Auto order toggle lives as a small persistent setting below the tabs.

---

## Screens & States

### Screen 1 — Name Selection (first visit only)

Shown when `localStorage` has no `selectedEmployeeId` or the stored ID no longer exists in the employee list.

**UI:**
- App name / logo
- Dropdown: list of all active employees ordered by name
- "Bắt đầu" button — disabled until an employee is selected
- On confirm: save `employeeId` to `localStorage` → navigate to Screen 2

**Rules:**
- Only active employees (`isActive = true`) appear in the dropdown
- If stored `employeeId` is no longer active → clear localStorage → show this screen again

---

### Screen 2 — Main Page (returning visits)

Header shows selected employee name + a small "Đổi tên" link to reset `localStorage` and return to Screen 1.

Balance is shown inline next to the name in the header:
- Balance ≥ 0: `"Số dư: {balance}đ"` in green
- Balance < 0: `"Nợ: {abs(balance)}đ"` in red

Two tabs: **Đặt cơm** (Order) and **Tài chính** (Finance).

Tab label for Finance shows current balance:
- Balance ≥ 0: `"Tài chính · {balance}đ"` (normal)
- Balance < 0: `"Tài chính · -{abs(balance)}đ"` (red)

Auto order toggle always visible below the tabs.

---

### Tab: Đặt cơm (Order)

#### State A — No menu today

```
Hôm nay chưa có thực đơn.
Quay lại sau nhé! 🍱
```

Shown when `GET /api/menu/today` returns `null` or `isPublished = false`.

#### State B — Menu published, not locked

**Standard menu cards** — shown only when `items.length > 0`. Each card layout:

```
┌─────────────────────────────────────────┐
│ Món chính          [5 người đã chọn] 45.000đ │
│ Cơm cá basa kho tộ                      │
│                                         │
│ Đồ ăn kèm                               │
│ ✔ Trứng luộc  ✔ Dưa muối chua           │
│ ✔ Canh mùng tơi giải nhiệt              │
│ ✔ Hoa quả tráng miệng                   │
│                                         │
│            [Đặt món]                    │
└─────────────────────────────────────────┘
```

Card content rules:
- **"Món chính"** label (muted, small) sits above the dish name
- **Dish name** — large, prominent text (e.g. "Cơm cá basa kho tộ")
- **Price** — displayed top-right of the card, formatted as `45.000đ`, accented color
- **"Đồ ăn kèm"** section — only shown when `sideDishes` is non-empty; label (muted, small) followed by each side dish on its own line prefixed with a checkmark `✔`; side dishes are split on comma (`,`) and trimmed
- **Order count badge** — shown only when `orderCount > 0`; text: `"{n} người đã chọn"`, displayed as a small badge near the price; if `orderCount === 0` the badge is hidden entirely
- **"Đặt món" button** — full-width at the bottom of the card

Employee's existing orders for today shown below the menu cards:

| Món | Số lượng | Thành tiền | |
|---|---|---|---|
| Cơm gà Hội An | 1 | 45.000đ | [Sửa] [Hủy] |

- **Đặt món**: opens inline form or modal → select `menuOfDayItemId`, set `quantity` (default 1) → submit → `POST /api/orders`
- **Sửa**: opens inline edit → change item or quantity → `PATCH /api/orders/[id]`
- **Hủy**: confirm dialog → `DELETE /api/orders/[id]`
- Optimistic UI — order list updates immediately on submit, reverts on error

**External dishes section** — shown when `externalDishes.length > 0`, below the standard section:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Món ăn ngoài
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Bún sườn chua — Trần Huy Liệu
[👉 Đặt tại đây ↗]

Cơm tấm Kiều Giang
[👉 Đặt tại đây ↗]
```

- Each item shows the dish name and a link button that opens `orderUrl` in a new tab (`target="_blank" rel="noopener noreferrer"`)
- Read-only — no interaction beyond clicking the link
- No ordering, no payment tracking — employee transacts entirely outside the system

**External-dishes-only day** — when `items.length === 0` and `externalDishes.length > 0`:
- Standard menu cards section and order list are hidden entirely
- Only the external dishes section is shown

#### State C — Menu locked

Same as State B but:
- No "Đặt món" button
- No "Sửa" / "Hủy" actions on orders
- Read-only banner: `"Admin đã chốt sổ. Không thể thay đổi đơn hàng."`
- External dishes section remains visible and links remain clickable

---

### Tab: Tài chính (Finance)

See `docs/features/F6-finance.md` for full Finance tab spec. Summary:

#### Balance Card

Shows current balance. Negative balance shows a warning.

#### Top-up Form

```
Số tiền muốn nạp: [___________] đ

← nhập số tiền → QR hiện ra ngay bên dưới (debounced 400ms) →

[QR code — 200×200px]
Nội dung: RDL - Hoang Do chuyen tien an trua
1234567890 — MB Bank — HOANG DO

[Xác nhận đã chuyển khoản]
```

- Member enters the amount they want to top up
- QR code appears automatically as member types — generated client-side via `buildVietQRUrl()` using `AppConfig` bank fields
- `addInfo` is auto-generated: `RDL - {removeDiacritics(employeeName)} chuyen tien an trua`
- If bank not configured in `AppConfig` → show `"Admin chưa cài đặt tài khoản ngân hàng"` instead of QR
- Member scans QR → bank app auto-fills account, amount, and transfer description → completes transfer
- Member clicks "Xác nhận đã chuyển khoản" → `POST /api/finance/topup` → balance updates immediately

#### Transaction History

Full ledger for this employee: top-ups, order debits, admin adjustments. Newest first.

---

### Auto Order Toggle

Always visible below the tabs, regardless of which tab is active.

```
[toggle] Tự động đặt cơm cho tôi
```

- Reflects current `Employee.autoOrder` value
- On toggle: `PATCH /api/employees/[id]` with `{ autoOrder: boolean }` — fire and forget, optimistic update
- Small helper text: `"Hệ thống sẽ tự đặt một món ngẫu nhiên khi admin đăng thực đơn"`

---

## User Stories

- [ ] US1: First-time visitor sees name selection screen and can select their name to proceed
- [ ] US2: Returning visitor lands directly on the order form without seeing name selection
- [ ] US3: Employee can see today's menu when it has been published
- [ ] US4: Employee can place an order for a meal portion
- [ ] US5: Employee can place multiple orders on the same day (different dishes)
- [ ] US6: Employee can edit quantity or change dish of an existing order
- [ ] US7: Employee can cancel an existing order
- [ ] US8: Employee sees read-only view with locked banner when admin has locked orders
- [ ] US9: Employee sees their current balance in the header and on the Finance tab label
- [ ] US10: Employee with negative balance sees a warning
- [ ] US11: Employee enters top-up amount — QR code appears automatically with correct bank info and transfer description
- [ ] US12: Employee scans QR with bank app — account, amount, and transfer description are auto-filled
- [ ] US13: Employee clicks "Xác nhận đã chuyển khoản" — balance updates immediately
- [ ] US14: Employee can view their full transaction history
- [ ] US15: Employee can toggle auto order on/off — persisted immediately
- [ ] US16: Employee can switch to a different name via "Đổi tên"
- [x] US17: Employee sees external dish links when any are available for today
- [x] US18: Clicking an external dish link opens the delivery platform in a new tab
- [x] US19: External dish links remain visible and clickable when orders are locked
- [x] US20: On an external-dishes-only day, employee sees only external dish links

---

## API Calls

| Action | Method | Endpoint | Body |
|---|---|---|---|
| Load employee list | GET | `/api/employees` | — |
| Load today's menu | GET | `/api/menu/today` | — |
| Load today's orders | GET | `/api/orders?employeeId=&date=` | — |
| Load balance | GET | `/api/finance/balance?employeeId=` | — |
| Load ledger history | GET | `/api/finance/ledger?employeeId=` | — |
| Load app config (for QR) | GET | `/api/config` | — |
| Place order | POST | `/api/orders` | `{ employeeId, menuOfDayItemId, quantity }` |
| Edit order | PATCH | `/api/orders/[id]` | `{ menuOfDayItemId?, quantity? }` |
| Cancel order | DELETE | `/api/orders/[id]` | — |
| Top up | POST | `/api/finance/topup` | `{ employeeId, amount }` |
| Toggle auto order | PATCH | `/api/employees/[id]` | `{ autoOrder: boolean }` |

---

## Component Structure

```
features/home/
├── components/
│   ├── home-name-select.tsx       — Screen 1: name selection
│   ├── home-header.tsx            — Selected name + balance display + "Đổi tên" link
│   ├── home-tabs.tsx              — Tab switcher (Đặt cơm / Tài chính with balance label)
│   ├── order-tab.tsx              — Tab: Đặt cơm (orchestrates states A/B/C)
│   ├── order-menu-card.tsx        — Single meal portion card with "Đặt món" button
│   ├── order-form.tsx             — Place/edit order form (quantity + item select)
│   ├── order-list.tsx             — Today's orders table with edit/cancel actions
│   ├── order-external-dishes.tsx  — External dish links section
│   ├── finance-tab.tsx            — Tab: Tài chính (imports from features/finance)
│   └── auto-order-toggle.tsx      — Toggle switch + helper text
├── hooks/
│   ├── use-today-menu.ts          — GET /api/menu/today
│   ├── use-today-orders.ts        — GET /api/orders?employeeId=&date=
│   ├── use-place-order.ts         — POST /api/orders
│   ├── use-edit-order.ts          — PATCH /api/orders/[id]
│   ├── use-cancel-order.ts        — DELETE /api/orders/[id]
│   └── use-toggle-auto-order.ts   — PATCH /api/employees/[id]
├── stores/
│   └── home.store.ts              — selectedEmployeeId (synced with localStorage)
└── index.ts
```

Finance tab content (balance card, topup form, history) is implemented in `features/finance/` and composed here.

---

## State Management

`selectedEmployeeId` is the only persistent client state:

```ts
const STORAGE_KEY = "selectedEmployeeId"

export const useHomeStore = create<HomeStore>((set) => ({
  selectedEmployeeId: localStorage.getItem(STORAGE_KEY) ?? null,
  setSelectedEmployee: (id: string) => {
    localStorage.setItem(STORAGE_KEY, id)
    set({ selectedEmployeeId: id })
  },
  clearSelectedEmployee: () => {
    localStorage.removeItem(STORAGE_KEY)
    set({ selectedEmployeeId: null })
  },
}))
```

All server state (menu, orders, employees, balance) managed by TanStack Query.

---

## Notes

- **Polling:** `use-today-menu` and `use-today-orders` refetch every 30s
- **Balance polling:** `use-my-balance` does NOT need to poll — it invalidates on top-up mutation and on order place/cancel/edit mutations
- **QR code:** generated client-side via `buildVietQRUrl()` from `src/shared/utils/viet-qr.ts`; requires `AppConfig.bankCode`, `bankAccount`, `bankAccountName` to be set; if any field is null → show "Admin chưa cài đặt tài khoản ngân hàng" instead of QR
- **QR debounce:** 400ms after last keystroke before QR updates — prevents spamming VietQR CDN
- **addInfo:** `RDL - {removeDiacritics(employeeName)} chuyen tien an trua` — diacritics stripped via `removeDiacritics()` from `src/shared/utils/text.ts`
- **Price formatting:** `{n.toLocaleString("vi-VN")}đ` (e.g. `45.000đ`)
- **Date display:** `dd/MM/yyyy` format throughout
- **Balance in tab label:** loading state shows `"Tài chính"` without amount until query resolves
- **Side dishes display:** split `sideDishes` string on comma (`,`) and trim each segment; render as a list of lines each prefixed with `✔`; if `sideDishes` is null or empty string, the "Đồ ăn kèm" section is hidden entirely
- **Order count:** sourced from `item.orderCount` in `MenuOfDayResponse`; only rendered when `orderCount > 0`; counts total quantity across all orders for that item (i.e. `SUM(Order.quantity)` grouped by `menuOfDayItemId`)

---

## UI Revision Notes

### Rev 1 — Menu card redesign: main dish + side dishes separation + order count (2025-04)

**Motivation:** The previous card mixed dish name and side dishes in one undifferentiated block, making it hard to distinguish what the main dish is. Users also requested social proof (how many colleagues picked this dish).

**Changes to `order-menu-card.tsx`:**
- Add a `"Món chính"` label (muted, `text-xs`) above the dish name
- Dish name uses larger, bolder font
- Add a `"Đồ ăn kèm"` section below the dish name (hidden if `sideDishes` is null/empty): split by comma, render each item on its own line with a leading `✔` icon
- Add order count badge (e.g. `"5 người đã chọn"`) displayed near the price — hidden when `orderCount === 0`

**Changes to `MenuOfDayResponse` (in `menu.md`):**
- `items[].orderCount: number` field added — server computes it via `_count: { orders: true }` in Prisma query (counts number of Order rows, not sum of quantity)

**No new API endpoints.** `GET /api/menu/today` returns the count inline with each item.