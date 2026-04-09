# SPEC: Finance Management (F6)

> Replaces F6 Monthly Report entirely.
> Member-facing: Finance tab on `/` (balance + top-up).
> Admin-facing: `/admin/finance` (fund overview, per-employee balances, adjustments).
> Domain knowledge → `docs/domains/ledger.md`, `docs/domains/employee.md`.

---

## Overview

The lunch fund system. Each employee has a running balance:
- **Positive** = pre-paid, ready to order
- **Zero / Negative** = owes money to the fund

Members top up by bank transfer and self-report the amount. Admin can correct balances and see the total fund health.

---

## Member-Facing: Finance Tab on `/`

Replaces the old "Thanh toán" tab. Tab label shows current balance:
- Balance ≥ 0: `"Tài chính · {balance}đ"` (green)
- Balance < 0: `"Tài chính · -{abs(balance)}đ"` (red)

---

### Screen: Finance Tab

#### Balance Card

```
━━━━━━━━━━━━━━━━━━━━━━━━━
Số dư của bạn
━━━━━━━━━━━━━━━━━━━━━━━━━
          45.000đ        ← green if ≥ 0, red if < 0

Số dư âm nghĩa là bạn đang nợ quỹ ăn trưa.
Vui lòng nạp tiền sớm nhé!   ← only shown when balance < 0
━━━━━━━━━━━━━━━━━━━━━━━━━
```

#### Top-up Form

```
Nạp tiền vào quỹ
──────────────────────────────────
Số tiền đã chuyển khoản:
[___________________] đ

QR code: [QR image if AppConfig.qrCodeUrl is set]

[Xác nhận nạp tiền]
──────────────────────────────────
```

- Amount input: integer VND, min 1000, no max
- On submit: `POST /api/finance/topup` with `{ employeeId, amount }`
- Balance card updates immediately after success (invalidate query)
- QR code shown so member can transfer before or after submitting

#### Transaction History

Below the top-up form:

```
Lịch sử giao dịch
──────────────────────────────────
04/04/2026  Đặt cơm              -45.000đ
03/04/2026  Nạp tiền            +200.000đ
03/04/2026  Đặt cơm              -45.000đ
02/04/2026  Đặt cơm              -45.000đ
──────────────────────────────────
```

- Newest first
- `topup` entries: label `"Nạp tiền"`, amount green with `+`
- `order_debit` entries: label `"Đặt cơm · {note}"` (note = date string), amount red with `-`
- `adjustment` entries: label `"Điều chỉnh số dư"`, amount green/red depending on sign
- No pagination for now — show all (history is typically short, ~30–50 entries per person)

---

## Admin-Facing: `/admin/finance`

Route: `/admin/finance`

The admin finance page has **two tabs**:
1. **Thành viên** — per-employee balances, adjustments (existing spec below)
2. **Lịch sử quỹ** — full fund timeline: every top-up and every lunch day's cost

---

### Tab: Thành viên

### Screen: Fund Overview + Member Balances

#### Fund Summary Bar

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Quỹ ăn trưa chung

Tổng số dư:  +350.000đ   ← green if ≥ 0
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

- Fund balance = SUM of all employee balances
- If negative: show `"Quỹ đang thiếu — admin cần bù {abs(amount)}đ"` in red

#### Member Balance Table

| Tên | Số dư | Lần nạp gần nhất | |
|---|---|---|---|
| Hoàng Đỗ | +150.000đ | 03/04/2026 | [Sửa số dư] [Lịch sử] |
| Duy Nghĩa | -45.000đ | 28/03/2026 | [Sửa số dư] [Lịch sử] |
| Hiếu | 0đ | — | [Sửa số dư] [Lịch sử] |

- Default sort: negative balance first (most urgent), then by name asc
- Balance column: red if negative, normal if ≥ 0
- "Lần nạp gần nhất": most recent `topup` entry date; `—` if none
- Only active employees shown

#### "Sửa số dư" — Balance Adjustment Sheet

Clicking "Sửa số dư" opens a right-side Sheet:

```
Sửa số dư — {employee name}
──────────────────────────────────
Số dư hiện tại: -45.000đ

Đặt số dư về:
[___________________] đ

Ghi chú:
[___________________]

[Xác nhận]  [Hủy]
──────────────────────────────────
```

- Admin inputs the **target balance** (what the balance should be after adjustment)
- System computes `delta = targetBalance - currentBalance` and writes one `adjustment` LedgerEntry
- Note field is optional; defaults to `"Admin adjustment"` if empty
- On success: table row updates, sheet closes

#### "Lịch sử" — Transaction History Sheet

Clicking "Lịch sử" opens a right-side Sheet showing full `LedgerEntry` history for that employee:

```
Lịch sử — {employee name}
──────────────────────────────────
04/04/2026  Đặt cơm              -45.000đ
03/04/2026  Điều chỉnh số dư    +50.000đ   (Admin adjustment)
03/04/2026  Nạp tiền            +200.000đ
──────────────────────────────────
```

Same format as member view. `adjustment` entries show note in parentheses.

#### Admin Top-up on Behalf

Admin can also add a top-up for any member directly from the adjustment sheet or a separate "Nạp hộ" button. Uses the same `POST /api/finance/topup` endpoint with `createdBy = adminEmployeeId`.

This is how admin records cash handed directly to them (member didn't self-report).

---

---

### Tab: Lịch sử quỹ

A chronological fund-level timeline. Each row is either a **top-up event** (someone deposited money) or a **lunch day** (the whole office ordered, costing the fund X total). Newest entries first.

#### Timeline View

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Lịch sử quỹ ăn trưa
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

04/04/2026  🍱 Cơm trưa          -450.000đ  [▶ Chi tiết]
04/04/2026  Nguyễn Văn A nạp     +100.000đ
03/04/2026  🍱 Cơm trưa          -360.000đ  [▶ Chi tiết]
02/04/2026  Trần Thị B nạp       +200.000đ
02/04/2026  🍱 Cơm trưa          -405.000đ  [▶ Chi tiết]
01/04/2026  Hoàng Đỗ nạp         +150.000đ
01/04/2026  Điều chỉnh: Hiếu     +50.000đ   (Admin adjustment)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Row types:**

| Type | Icon / Label | Amount color | Expandable? |
|---|---|---|---|
| Lunch day (orders) | `🍱 Cơm trưa` | Red `-` | Yes — [▶ Chi tiết] |
| Top-up | `{employee name} nạp` | Green `+` | No |
| Adjustment | `Điều chỉnh: {employee name}` + note | Green/red | No |

**Lunch day row amount** = `SUM(order.quantity × menuOfDayItem.price)` across all orders that day. This is the total cost drawn from the fund that day.

**Top-up and adjustment rows** are individual `LedgerEntry` records with `type = "topup"` or `type = "adjustment"`. Multiple top-ups on the same day are shown as separate rows.

---

#### Expanded Lunch Day Detail

Clicking [▶ Chi tiết] on a lunch day row expands it inline:

```
04/04/2026  🍱 Cơm trưa                    -450.000đ  [▼ Ẩn]
  ┌──────────────────────────────────────────────────────┐
  │  Cơm gà Hội An      ×5   225.000đ                   │
  │    • Nguyễn Văn A   ×1                               │
  │    • Trần Thị B     ×2                               │
  │    • Hoàng Đỗ       ×2                               │
  │  Cơm bò             ×3   135.000đ                   │
  │    • Lê Minh Đức    ×1                               │
  │    • Hồ Bá Hưng     ×2                               │
  │  Phở gà HN          ×2    90.000đ                   │
  │    • Ngô Duy Nghĩa  ×2                               │
  │  ──────────────────────────────────                  │
  │  10 suất             Tổng: 450.000đ                  │
  └──────────────────────────────────────────────────────┘
04/04/2026  Nguyễn Văn A nạp               +100.000đ
```

The detail panel shows orders **grouped by dish name**, summed quantity, with subtotal per dish. This is the same data as the kitchen summary box but for historical reference.

- Dishes sorted by quantity desc (highest first)
- Footer: total portions + total amount
- Clicking [▼ Ẩn] collapses the detail panel

**Note:** The detail data comes from live `Order` records joined with `MenuOfDayItem`. If orders are cancelled after the fact, the detail will reflect the current state. The top-level row amount is also live-computed.

---

#### Filtering

Simple month filter above the timeline:

```
[◀] Tháng 4, 2026 [▶]
```

- Defaults to current month
- Filters all rows (both lunch days and top-ups) to that calendar month
- On change: refetch `GET /api/finance/fund-ledger?month=YYYY-MM`

---

## User Stories

### Member (Finance Tab on `/`)
- [ ] US1: Member sees their current balance on the Finance tab label (green or red)
- [ ] US2: Member sees a negative balance warning when they owe money
- [ ] US3: Member can submit a top-up amount — balance updates immediately
- [ ] US4: Member sees the QR code to know where to transfer
- [ ] US5: Member sees full transaction history (top-ups, order debits, adjustments)

### Admin (`/admin/finance`)
- [ ] US6: Admin sees total fund balance (positive = surplus, negative = deficit)
- [ ] US7: Admin sees all active employees with their current balance, sorted by most negative first
- [ ] US8: Admin can adjust any employee's balance to a specific target value
- [ ] US9: Admin can view full transaction history for any employee
- [ ] US10: Admin can add a top-up on behalf of any employee
- [ ] US11: Admin sees the fund timeline (Lịch sử quỹ tab) with top-ups and lunch days
- [ ] US12: Admin can expand a lunch day row to see dish-level breakdown
- [ ] US13: Admin can filter the fund timeline by month

---

## API Calls

| Action | Method | Endpoint | Body / Params |
|---|---|---|---|
| Get my balance | GET | `/api/finance/balance?employeeId=` | — |
| Get my ledger history | GET | `/api/finance/ledger?employeeId=` | — |
| Top up | POST | `/api/finance/topup` | `{ employeeId, amount, createdBy? }` |
| Get all balances (admin) | GET | `/api/finance/summary` | — |
| Adjust balance (admin) | POST | `/api/finance/adjust` | `{ employeeId, targetBalance, note? }` |
| Get fund timeline (admin) | GET | `/api/finance/fund-ledger?month=YYYY-MM` | — |

### POST /api/finance/topup

```ts
type TopupInput = {
  employeeId: string
  amount: number    // positive integer VND, min 1000
  createdBy?: string  // if absent, defaults to employeeId (self top-up)
}
```

Validation: `amount >= 1000`. Returns updated `BalanceResponse`.

### POST /api/finance/adjust (admin)

```ts
type AdjustInput = {
  employeeId: string
  targetBalance: number  // desired resulting balance (can be any signed integer)
  note?: string
  adminEmployeeId: string  // who is making the adjustment
}
```

Returns updated `BalanceResponse`.

### GET /api/finance/fund-ledger?month=YYYY-MM

Returns a unified timeline for the requested month, sorted by date desc (newest first). Each item is either a lunch day summary or an individual ledger entry (top-up / adjustment).

```ts
type FundLedgerItem =
  | {
      type: "lunch_day"
      date: string            // "YYYY-MM-DD"
      totalAmount: number     // negative integer — total cost for the day
      orderCount: number      // total portions ordered
      // Expanded detail — always included in response (client controls expand state)
      dishes: {
        name: string
        quantity: number
        subtotal: number      // quantity × price
        employees: { name: string; quantity: number }[]  // sorted by name asc
      }[]
    }
  | {
      type: "topup" | "adjustment"
      date: string            // "YYYY-MM-DD"
      amount: number          // signed integer
      employeeName: string    // name of the employee this entry belongs to
      note: string | null
    }

type FundLedgerResponse = {
  month: string              // "YYYY-MM"
  items: FundLedgerItem[]
}
```

**Server logic:**
1. Query all `LedgerEntry` records where `type IN ("topup", "adjustment")` within the month → each becomes a `topup`/`adjustment` item
2. Query all `MenuOfDay` records within the month that have at least one `Order` → each becomes a `lunch_day` item, with orders grouped by dish name
3. Merge and sort by date desc

**Important:** `lunch_day` amounts are computed from live `Order` + `MenuOfDayItem` records, **not** from `order_debit` ledger entries. This ensures the display reflects current order state (e.g. after cancellations). The `order_debit` ledger entries exist for per-employee balance tracking only.

---

## Component Structure

```
features/finance/
├── components/
│   ├── finance-tab.tsx                  — Finance tab content (member view)
│   ├── finance-balance-card.tsx         — Balance display with negative warning
│   ├── finance-topup-form.tsx           — Amount input + QR code + submit button
│   ├── finance-history-list.tsx         — Transaction list (member + admin per-employee sheet)
│   ├── finance-summary-bar.tsx          — Fund total for admin page
│   ├── finance-member-table.tsx         — All employees balance table
│   ├── finance-member-row.tsx           — Single row with balance + action buttons
│   ├── finance-adjust-sheet.tsx         — Right-side Sheet for balance adjustment
│   ├── finance-history-sheet.tsx        — Right-side Sheet for employee ledger history
│   ├── fund-ledger-tab.tsx              — Lịch sử quỹ tab container
│   ├── fund-ledger-month-selector.tsx   — Prev/next month filter
│   ├── fund-ledger-list.tsx             — Timeline list of FundLedgerItems
│   ├── fund-ledger-lunch-row.tsx        — Lunch day row with expand/collapse
│   ├── fund-ledger-lunch-detail.tsx     — Expanded dish breakdown panel
│   └── fund-ledger-entry-row.tsx        — Top-up / adjustment row (non-expandable)
├── hooks/
│   ├── use-my-balance.ts                — GET /api/finance/balance?employeeId=
│   ├── use-my-ledger.ts                 — GET /api/finance/ledger?employeeId=
│   ├── use-topup.ts                     — POST /api/finance/topup
│   ├── use-finance-summary.ts           — GET /api/finance/summary
│   ├── use-adjust-balance.ts            — POST /api/finance/adjust
│   └── use-fund-ledger.ts               — GET /api/finance/fund-ledger?month=
└── index.ts
```

---

## Balance Display on Home Page (Outside Finance Tab)

The balance (or debt) is shown **outside the tab** in the main header area of Screen 2, so members always see it without switching tabs:

```
Hoàng Đỗ  [Đổi tên]          Số dư: 45.000đ   ← green
Hiếu      [Đổi tên]          Nợ: 45.000đ      ← red
```

This uses the same `use-my-balance` hook. No additional API call — reuse existing query cache.

---

## Notes

- **No approval for top-ups** — immediate, self-service; admin corrects via adjustment if wrong
- **Negative balance is allowed** — show warning, never block ordering
- **`order_debit` entries are written in the same transaction as the Order** — see `docs/domains/ledger.md`
- **QR code** — same `AppConfig.qrCodeUrl` used in the old payment tab; no new config needed
- **Amount formatting** — `{n.toLocaleString("vi-VN")}đ` throughout; prefix `+` for positive, `-` for negative
- **Tab label** — computed from `use-my-balance` response; shows `"Tài chính · +45.000đ"` or `"Tài chính · -45.000đ"`; loading state shows `"Tài chính"` without amount
- **Fund deficit warning** — shown only to admin on `/admin/finance`; not shown to members