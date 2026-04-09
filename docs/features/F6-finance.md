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
Số tiền muốn nạp:
[___________________] đ

← khi nhập số tiền → QR hiện ra bên dưới →

[QR code — 200×200px]
Nội dung: RDL - Vu Ngoc Anh chuyen tien an trua
1234567890 — MB Bank — VU NGOC ANH

[Xác nhận đã chuyển khoản]
──────────────────────────────────
```

**Behavior:**

- Amount input: positive integer VND, min 1000, no max
- QR code appears only when `amount > 0` AND bank info is configured in `AppConfig`
- QR updates as member types — debounced 400ms to avoid spamming VietQR CDN
- If `AppConfig.bankCode` is null → show message `"Admin chưa cài đặt tài khoản ngân hàng"` instead of QR
- `addInfo` is auto-generated — not editable by member:
  `RDL - {removeDiacritics(employeeName)} chuyen tien an trua`
  e.g. `"RDL - Vu Ngoc Anh chuyen tien an trua"`
- Below the QR: show bank account info as text (account number, bank short name, account name) so member can also transfer manually
- QR is a plain `<img src={vietQRUrl}>` — generated client-side via `buildVietQRUrl()`, no server call
- On submit ("Xác nhận đã chuyển khoản"): `POST /api/finance/topup` with `{ employeeId, amount }`
- Balance card updates immediately after success (invalidate `balance` query)
- Toast: `"Đã ghi nhận nạp {amount}đ vào quỹ"`

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
- `order_debit` entries: label `"Đặt cơm"`, amount red with `-`
- `adjustment` entries: label `"Điều chỉnh số dư"`, amount green/red depending on sign
- No pagination for now — show all (history is typically short, ~30–50 entries per person)

---

## Admin-Facing: `/admin/finance`

Route: `/admin/finance`

The admin finance page has **two tabs**:
1. **Thành viên** — per-employee balances, adjustments
2. **Lịch sử quỹ** — full fund timeline: every top-up and every lunch day's cost

---

### Tab: Thành viên

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

Admin can add a top-up for any member directly from the balance table via a "Nạp hộ" button.
Uses the same `POST /api/finance/topup` endpoint with `createdBy = adminEmployeeId`.

This is how admin records cash handed directly to them (member didn't self-report).

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

**Lunch day row amount** = `SUM(order.quantity × menuOfDayItem.price)` across all orders that day.

**Top-up and adjustment rows** are individual `LedgerEntry` records — multiple top-ups on the same day appear as separate rows.

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

- Dishes sorted by quantity desc
- Footer: total portions + total amount
- Clicking [▼ Ẩn] collapses the detail panel

**Note:** Detail data comes from live `Order` records joined with `MenuOfDayItem`. The top-level row amount is also live-computed. If orders are cancelled after the fact, both the detail and the total reflect the current state.

---

#### Filtering

```
[◀] Tháng 4, 2026 [▶]
```

- Defaults to current month
- Filters all rows (lunch days + top-ups + adjustments) to that calendar month
- On change: refetch `GET /api/finance/fund-ledger?month=YYYY-MM`

---

## User Stories

### Member (Finance Tab on `/`)
- [ ] US1: Member sees their current balance on the Finance tab label (green or red)
- [ ] US2: Member sees a negative balance warning when they owe money
- [ ] US3: Member enters a top-up amount — QR code appears immediately (debounced)
- [ ] US4: Member scans the QR code — bank app auto-fills account, amount, and transfer description
- [ ] US5: Member clicks "Xác nhận đã chuyển khoản" — balance updates immediately
- [ ] US6: Member sees full transaction history (top-ups, order debits, adjustments)
- [ ] US7: If bank not configured, member sees a message instead of QR

### Admin (`/admin/finance`)
- [ ] US8: Admin sees total fund balance (positive = surplus, negative = deficit)
- [ ] US9: Admin sees all active employees with their current balance, sorted by most negative first
- [ ] US10: Admin can adjust any employee's balance to a specific target value
- [ ] US11: Admin can view full transaction history for any employee
- [ ] US12: Admin can add a top-up on behalf of any employee
- [ ] US13: Admin sees the fund timeline (Lịch sử quỹ tab) with top-ups and lunch days
- [ ] US14: Admin can expand a lunch day row to see dish-level breakdown
- [ ] US15: Admin can filter the fund timeline by month

---

## API Calls

| Action | Method | Endpoint | Body / Params |
|---|---|---|---|
| Get my balance | GET | `/api/finance/balance?employeeId=` | — |
| Get my ledger history | GET | `/api/finance/ledger?employeeId=` | — |
| Top up | POST | `/api/finance/topup` | `{ employeeId, amount, createdBy? }` |
| Get all balances (admin) | GET | `/api/finance/summary` | — |
| Adjust balance (admin) | POST | `/api/finance/adjust` | `{ employeeId, targetBalance, note?, adminEmployeeId }` |
| Get fund timeline (admin) | GET | `/api/finance/fund-ledger?month=YYYY-MM` | — |
| Get app config (for QR) | GET | `/api/config` | — |

### POST /api/finance/topup

```ts
type TopupInput = {
  employeeId: string
  amount: number      // positive integer VND, min 1000
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
  adminEmployeeId: string
}
```

Returns updated `BalanceResponse`.

### GET /api/finance/fund-ledger?month=YYYY-MM

```ts
type FundLedgerItem =
  | {
      type: "lunch_day"
      date: string            // "YYYY-MM-DD"
      totalAmount: number     // negative integer — total cost for the day
      orderCount: number
      dishes: {
        name: string
        quantity: number
        subtotal: number      // quantity × price
        employees: { name: string; quantity: number }[]  // sorted by name asc
      }[]
    }
  | {
      type: "topup" | "adjustment"
      date: string
      amount: number
      employeeName: string
      note: string | null
    }

type FundLedgerResponse = {
  month: string   // "YYYY-MM"
  items: FundLedgerItem[]
}
```

**Server logic:**
1. Query all `LedgerEntry` records where `type IN ("topup", "adjustment")` within the month → each becomes a `topup`/`adjustment` item
2. Query all `MenuOfDay` records within the month that have at least one `Order` → each becomes a `lunch_day` item with orders grouped by dish name
3. Merge and sort by date desc

**Important:** `lunch_day` amounts are computed from live `Order` + `MenuOfDayItem` records, not from `order_debit` entries. `order_debit` entries exist for per-employee balance tracking only.

---

## Component Structure

```
features/finance/
├── components/
│   ├── finance-tab.tsx                  — Finance tab content (member view)
│   ├── finance-balance-card.tsx         — Balance display with negative warning
│   ├── finance-topup-form.tsx           — Amount input + dynamic QR + submit button
│   ├── finance-qr-display.tsx           — QR <img> + bank info text + "not configured" fallback
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

Shown outside the tab in the main header area so members always see it:

```
Hoàng Đỗ  [Đổi tên]          Số dư: 45.000đ   ← green
Hiếu      [Đổi tên]          Nợ: 45.000đ      ← red
```

Uses the same `use-my-balance` hook. No additional API call — reuse existing query cache.

---

## Notes

- **No approval for top-ups** — immediate, self-service; admin corrects via adjustment if wrong
- **Negative balance is allowed** — show warning, never block ordering
- **`order_debit` entries are written in the same transaction as the Order** — see `docs/domains/ledger.md`
- **QR is dynamic, client-side** — built via `buildVietQRUrl()` from `src/shared/utils/viet-qr.ts`; no file storage; requires `AppConfig.bankCode`, `bankAccount`, `bankAccountName` to be set
- **addInfo format** — `RDL - {removeDiacritics(employeeName)} chuyen tien an trua`; diacritics removed via `removeDiacritics()` from `src/shared/utils/text.ts` because many Vietnamese bank apps reject transfer descriptions with diacritics
- **QR debounce** — 400ms after last keystroke before updating `<img src>`; prevents spamming VietQR CDN on every keypress
- **Amount formatting** — `{n.toLocaleString("vi-VN")}đ` throughout; prefix `+` for positive, `-` for negative
- **Tab label** — `"Tài chính · +45.000đ"` or `"Tài chính · -45.000đ"`; loading state shows `"Tài chính"` without amount
- **Fund deficit warning** — shown only to admin on `/admin/finance`; not shown to members