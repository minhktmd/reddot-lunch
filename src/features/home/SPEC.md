# SPEC: Home (F1)

> Employee-facing home page. The only page most employees will ever use.
> Domain knowledge → `docs/domains/order.md`, `docs/domains/employee.md`, `docs/domains/menu.md`.
> Route: `/`

---

## Overview

Single page with three concerns:

1. **Name selection** — first visit only; subsequent visits skip straight to the order form
2. **Order tab** — view today's menu, place/edit/cancel orders
3. **Payment tab** — view all unpaid orders, pay all at once via QR code

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

Header shows selected employee name + a small "Đổi người đặt" link to reset `localStorage` and return to Screen 1.

Two tabs: **Đặt cơm** (Order) and **Thanh toán** (Payment).

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

Show today's meal portions as a list of cards. Each card:
- Dish name
- Price (formatted: `45.000đ`)
- Side dishes (if any)
- "Đặt món" button

Employee's existing orders for today shown below the menu cards:

| Món | Số lượng | Thành tiền | |
|---|---|---|---|
| Cơm gà Hội An | 1 | 45.000đ | [Sửa] [Hủy] |

- **Đặt món**: opens inline form or modal → select `menuOfDayItemId`, set `quantity` (default 1) → submit → `POST /api/orders`
- **Sửa**: opens inline edit → change item or quantity → `PATCH /api/orders/[id]`
- **Hủy**: confirm dialog → `DELETE /api/orders/[id]`
- Optimistic UI — order list updates immediately on submit, reverts on error

#### State C — Menu locked

Same as State B but:
- No "Đặt món" button
- No "Sửa" / "Hủy" actions
- Read-only banner: `"Admin đã chốt sổ. Không thể thay đổi đơn hàng."`

---

### Tab: Thanh toán (Payment)

#### State A — No unpaid orders

```
Bạn không có khoản nợ nào. 🎉
```

#### State B — Has unpaid orders

Table of all unpaid orders across entire history:

| Ngày | Món | SL | Đơn giá | Thành tiền |
|---|---|---|---|---|
| 04/04/2026 | Cơm gà Hội An | 1 | 45.000đ | 45.000đ |
| 03/04/2026 | Cơm thịt kho tàu | 2 | 45.000đ | 90.000đ |

- **Tổng cần trả:** `135.000đ` — shown prominently
- QR code image from `AppConfig.qrCodeUrl` (if set)
- "Xác nhận đã chuyển khoản" button → `PATCH /api/orders/pay` with `{ employeeId }` → marks all unpaid orders as paid
- After confirmation: table clears, show State A

---

### Auto Order Toggle

Always visible below the tabs, regardless of which tab is active.

```
[toggle] Tự động đặt cơm cho tôi
```

- Reflects current `Employee.autoOrder` value
- On toggle: `PATCH /api/employees/[id]` with `{ autoOrder: boolean }` — fire and forget, optimistic update
- Small helper text: `"Hệ thống sẽ tự đặt một món ngẫu nhiên hàng ngày khi admin đăng thực đơn"`

---

## User Stories

- [x] US1: First-time visitor sees name selection screen and can select their name to proceed
- [x] US2: Returning visitor lands directly on the order form without seeing name selection
- [x] US3: Employee can see today's menu when it has been published
- [x] US4: Employee can place an order for a meal portion
- [x] US5: Employee can place multiple orders on the same day (different dishes)
- [x] US6: Employee can edit quantity or change dish of an existing order
- [x] US7: Employee can cancel an existing order
- [x] US8: Employee sees read-only view with locked banner when admin has locked orders
- [x] US9: Employee sees all unpaid orders across history in the Payment tab
- [x] US10: Employee can confirm payment — all unpaid orders marked as paid at once
- [x] US11: Employee can toggle auto order on/off — persisted immediately
- [x] US12: Employee can switch to a different name via "Đổi người đặt"

---

## API Calls

| Action | Method | Endpoint | Body |
|---|---|---|---|
| Load employee list | GET | `/api/employees` | — |
| Load today's menu | GET | `/api/menu/today` | — |
| Load today's orders | GET | `/api/orders?employeeId=&date=` | — |
| Load unpaid orders | GET | `/api/orders/unpaid?employeeId=` | — |
| Place order | POST | `/api/orders` | `{ employeeId, menuOfDayItemId, quantity }` |
| Edit order | PATCH | `/api/orders/[id]` | `{ menuOfDayItemId?, quantity? }` |
| Cancel order | DELETE | `/api/orders/[id]` | — |
| Confirm payment | PATCH | `/api/orders/pay` | `{ employeeId }` |
| Toggle auto order | PATCH | `/api/employees/[id]` | `{ autoOrder: boolean }` |

---

## Component Structure

```
features/home/
├── components/
│   ├── home-name-select.tsx       — Screen 1: name selection
│   ├── home-header.tsx            — Selected name + "Đổi người đặt" link
│   ├── home-tabs.tsx              — Tab switcher (Đặt cơm / Thanh toán)
│   ├── order-tab.tsx              — Tab: Đặt cơm (orchestrates states A/B/C)
│   ├── order-menu-card.tsx        — Single meal portion card with "Đặt món" button
│   ├── order-form.tsx             — Place/edit order form (quantity + item select)
│   ├── order-list.tsx             — Today's orders table with edit/cancel actions
│   ├── payment-tab.tsx            — Tab: Thanh toán (orchestrates states A/B)
│   ├── payment-table.tsx          — Unpaid orders table
│   ├── payment-qr.tsx             — QR code image + total amount + confirm button
│   └── auto-order-toggle.tsx      — Toggle switch + helper text
├── hooks/
│   ├── use-today-menu.ts          — GET /api/menu/today
│   ├── use-today-orders.ts        — GET /api/orders?employeeId=&date=
│   ├── use-unpaid-orders.ts       — GET /api/orders/unpaid?employeeId=
│   ├── use-place-order.ts         — POST /api/orders
│   ├── use-edit-order.ts          — PATCH /api/orders/[id]
│   ├── use-cancel-order.ts        — DELETE /api/orders/[id]
│   ├── use-pay-all.ts             — PATCH /api/orders/pay
│   └── use-toggle-auto-order.ts   — PATCH /api/employees/[id]
├── stores/
│   └── home.store.ts              — selectedEmployeeId (synced with localStorage)
└── index.ts
```

---

## State Management

`selectedEmployeeId` is the only persistent client state:

```ts
// src/features/home/stores/home.store.ts
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

All server state (menu, orders, employees) managed by TanStack Query.

---

## Notes

- **Polling:** `use-today-menu` and `use-today-orders` should refetch every 30s — the menu state (`isPublished`, `isLocked`) can change while the employee has the page open
- **QR code:** if `AppConfig.qrCodeUrl` is null, hide the QR section entirely — do not show a broken image
- **Price formatting:** always display VND amounts as `{n.toLocaleString("vi-VN")}đ` (e.g. `45.000đ`)
- **Date display:** use `dd/MM/yyyy` format throughout (e.g. `04/04/2026`)