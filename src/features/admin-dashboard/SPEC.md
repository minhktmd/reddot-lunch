# SPEC: Admin Dashboard (F2)

> Admin daily overview page.
> Domain knowledge → `docs/domains/order.md`, `docs/domains/menu.md`, `docs/domains/employee.md`.
> Route: `/admin`

---

## Overview

The admin's primary monitoring page. Shows everything needed to manage a single day:

- How many people have ordered vs. not yet ordered
- Aggregated meal summary (for kitchen)
- Payment status across all employees
- Quick access to lock/unlock orders

This page is **read-only** — no order editing happens here. Mutations go through `/admin/menu` (menu) and employee home page (orders).

---

## Screens & States

### State A — No menu today

```
Hôm nay chưa có thực đơn.
→ Tạo thực đơn  (link to /admin/menu)
```

Shown when `GET /api/menu/today` returns `{ status: "prefill" }` or menu is not published.

---

### State B — Menu published (main view)

Four sections on the page:

---

#### Section 1 — Status Bar

```
Thứ Tư, 04/04/2026  •  Đã đăng  •  [Chốt sổ]
```

Or if locked:

```
Thứ Tư, 04/04/2026  •  Đã chốt  •  [Mở lại]
```

- Lock/Unlock buttons trigger confirm dialog → call `POST /api/menu/[id]/lock` or `/unlock`
- After action: page refetches all data

---

#### Section 2 — Order Summary

Two columns side by side:

**Đã đặt (N người):**

| Tên | Món | SL | Tiền |
|---|---|---|---|
| Hoàng Đỗ | Cơm gà Hội An | 1 | 45.000đ |
| Duy Nghĩa | Cơm thịt kho tàu | 2 | 90.000đ |

One row per order (not per employee — an employee with 2 orders appears twice).

**Chưa đặt (N người):**

List of employee names who have no orders for today.

- Only active employees (`isActive = true`) counted
- Employees with auto order are included in "Đã đặt" once their auto order is created

---

#### Section 3 — Meal Summary (Kitchen Box)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━
Tóm tắt gửi bếp
━━━━━━━━━━━━━━━━━━━━━━━━━━
Cơm gà Hội An       x 5
Cơm thịt kho tàu    x 3
Phở gà HN           x 2
━━━━━━━━━━━━━━━━━━━━━━━━━━
Tổng: 10 suất — 450.000đ
```

- "Sao chép" button → copies to clipboard
- Grouped by dish name, summed quantity
- Total amount = sum of `(order.quantity × menuOfDayItem.price)` for all orders today

---

#### Section 4 — Payment Status

Two columns:

**Đã trả (N người):**

| Tên | Số tiền | Thời gian |
|---|---|---|
| Hoàng Đỗ | 45.000đ | 11:32 |
| Duy Nghĩa | 90.000đ | 12:01 |

**Chưa trả (N người):**

| Tên | Số tiền |
|---|---|
| Hiếu | 45.000đ |
| Tuấn Minh | 45.000đ |

- Only employees who have orders today are shown
- "Đã trả" = at least one order with `isPaid = true` today
- "Chưa trả" = has orders today but all `isPaid = false`
- Amount shown = sum of `(quantity × price)` for that employee's orders today
- Admin can click "Hoàn tác" (undo) next to a paid employee → `PATCH /api/orders/unpay` with `{ employeeId, date }`

---

## Polling

This page refetches every **30 seconds** — orders and payment status change throughout the day as employees interact.

---

## User Stories

- [ ] US1: Admin sees "no menu" prompt when menu is not published yet
- [ ] US2: Admin sees the list of employees who have ordered today
- [ ] US3: Admin sees the list of employees who have not yet ordered
- [ ] US4: Admin sees the aggregated meal summary (kitchen box) with copy button
- [ ] US5: Admin sees total revenue from today's orders
- [ ] US6: Admin sees payment status split into paid vs unpaid
- [ ] US7: Admin can undo payment for an employee
- [ ] US8: Admin can lock orders from this page
- [ ] US9: Admin can unlock orders from this page
- [ ] US10: Page auto-refreshes every 30 seconds

---

## API Calls

| Action | Method | Endpoint | Body |
|---|---|---|---|
| Load today's menu | GET | `/api/menu/today` | — |
| Load today's orders | GET | `/api/orders/today` | — |
| Load all employees | GET | `/api/employees` | — |
| Lock menu | POST | `/api/menu/[id]/lock` | — |
| Unlock menu | POST | `/api/menu/[id]/unlock` | — |
| Undo payment | PATCH | `/api/orders/unpay` | `{ employeeId, date }` |

---

## Component Structure

```
features/admin-dashboard/
├── components/
│   ├── dashboard-status-bar.tsx       — Date, status badge, lock/unlock button
│   ├── dashboard-order-summary.tsx    — Two-column: ordered vs not ordered
│   ├── dashboard-order-list.tsx       — Table of employees who have ordered
│   ├── dashboard-no-order-list.tsx    — List of employees who haven't ordered
│   ├── dashboard-kitchen-summary.tsx  — Aggregated meal box + copy button
│   ├── dashboard-payment-status.tsx   — Two-column: paid vs unpaid
│   ├── dashboard-paid-list.tsx        — Paid employees table with undo button
│   └── dashboard-unpaid-list.tsx      — Unpaid employees table
├── hooks/
│   ├── use-today-menu.ts              — GET /api/menu/today (refetch 30s)
│   ├── use-today-orders.ts            — GET /api/orders/today (refetch 30s)
│   ├── use-employees.ts               — GET /api/employees
│   ├── use-lock-menu.ts               — POST /api/menu/[id]/lock
│   ├── use-unlock-menu.ts             — POST /api/menu/[id]/unlock
│   └── use-unpay-orders.ts            — PATCH /api/orders/unpay
└── index.ts
```

---

## Derived Data (computed client-side)

All derived from `orders/today` + `employees` responses — no extra API calls needed:

```ts
// Employees who have ordered today
const orderedEmployeeIds = new Set(todayOrders.map(o => o.employee.id))

// Employees who have NOT ordered
const notOrdered = employees.filter(e => !orderedEmployeeIds.has(e.id))

// Meal summary: group by dish name, sum quantity
const mealSummary = todayOrders.reduce((acc, order) => {
  const name = order.menuOfDayItem.menuItem.name
  acc[name] = (acc[name] ?? 0) + order.quantity
  return acc
}, {} as Record<string, number>)

// Payment summary per employee
const paymentByEmployee = todayOrders.reduce((acc, order) => {
  const { employeeId } = order
  if (!acc[employeeId]) acc[employeeId] = { paid: 0, unpaid: 0 }
  const amount = order.quantity * order.menuOfDayItem.price
  if (order.isPaid) acc[employeeId].paid += amount
  else acc[employeeId].unpaid += amount
  return acc
}, {} as Record<string, { paid: number; unpaid: number }>)
```

---

## Notes

- **No order editing here** — this page is monitoring only; direct employees to `/` for order changes
- **Undo payment scope** — undoes all paid orders for that employee on today's date only
- **Price formatting** — `{n.toLocaleString("vi-VN")}đ` throughout (e.g. `45.000đ`)
- **paidAt time display** — show time only (`HH:mm`), not full datetime — date is always today