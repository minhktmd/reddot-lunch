# SPEC: Admin Dashboard (F2)

> Admin daily overview page.
> Domain knowledge → `docs/domains/order.md`, `docs/domains/menu.md`, `docs/domains/employee.md`.
> Route: `/admin`

---

## Overview

The admin's primary monitoring page. Shows everything needed to manage a single day:

- How many people have ordered vs. not yet ordered
- Aggregated meal summary (for kitchen)
- Quick balance overview — who is in debt today
- Quick access to lock/unlock orders

This page is **read-only** for orders — no order editing happens here. Balance editing is on `/admin/finance`.

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
| **Tổng** | | | **135.000đ** |

- One row per order (not per employee — an employee with 2 orders appears twice)
- Footer row shows total amount = `SUM(order.quantity × menuOfDayItem.price)` across all today's orders
- Footer rendered as `<tfoot>` with bold text and a top border

**Chưa đặt (N người):**

List of employee names who have no orders for today.

- Only active employees (`isActive = true`) counted

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

---

#### Section 4 — Balance Overview (Quick View)

A compact summary of who is in debt. Full balance management is at `/admin/finance`.

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Số dư thành viên    →  Xem chi tiết (/admin/finance)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Quỹ chung: +350.000đ

Đang nợ (2 người):
• Duy Nghĩa  —  -45.000đ
• Hiếu       —  -90.000đ
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

- Shows total fund balance (sum of all employee balances)
- Lists only employees with negative balance
- "Xem chi tiết" link → navigates to `/admin/finance`
- No editing here — that's in `/admin/finance`

Data sourced from `GET /api/finance/summary` (same endpoint as finance page).

---

## Polling

This page refetches every **30 seconds** — orders change throughout the day.

---

## User Stories

- [ ] US1: Admin sees "no menu" prompt when menu is not published yet
- [ ] US2: Admin sees the list of employees who have ordered today
- [ ] US3: Admin sees the list of employees who have not yet ordered
- [ ] US4: Admin sees the aggregated meal summary (kitchen box) with copy button
- [ ] US5: Admin sees total revenue from today's orders in the "Đã đặt" table footer
- [ ] US6: Admin sees fund total balance and which employees are in debt
- [ ] US7: Admin can navigate to `/admin/finance` for full balance management
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
| Load finance summary | GET | `/api/finance/summary` | — |
| Lock menu | POST | `/api/menu/[id]/lock` | — |
| Unlock menu | POST | `/api/menu/[id]/unlock` | — |

---

## Component Structure

```
features/admin-dashboard/
├── components/
│   ├── dashboard-status-bar.tsx       — Date, status badge, lock/unlock button
│   ├── dashboard-order-summary.tsx    — Two-column: ordered vs not ordered
│   ├── dashboard-order-list.tsx       — Table of employees who have ordered + total footer row
│   ├── dashboard-no-order-list.tsx    — List of employees who haven't ordered
│   ├── dashboard-kitchen-summary.tsx  — Aggregated meal box + copy button
│   └── dashboard-balance-overview.tsx — Fund total + debt list + link to /admin/finance
├── hooks/
│   ├── use-today-menu.ts              — GET /api/menu/today (refetch 30s)
│   ├── use-today-orders.ts            — GET /api/orders/today (refetch 30s)
│   ├── use-employees.ts               — GET /api/employees
│   ├── use-finance-summary.ts         — GET /api/finance/summary
│   ├── use-lock-menu.ts               — POST /api/menu/[id]/lock
│   └── use-unlock-menu.ts             — POST /api/menu/[id]/unlock
└── index.ts
```

---

## Notes

- **No payment undo here** — the old "Hoàn tác" (undo payment) button is removed; balance management is entirely at `/admin/finance`
- **Price formatting** — `{n.toLocaleString("vi-VN")}đ` throughout
- **Balance section** is a read-only summary; full CRUD at `/admin/finance`