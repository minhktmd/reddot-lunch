# Domain: Ledger

> Schema, business rules, and balance computation for the lunch fund.
> Big picture → `docs/OVERVIEW.md`.
> Feature detail → `src/features/finance/SPEC.md`.

---

## Overview

The lunch fund is a shared pool. Each employee has a **virtual balance** — the running total of all their top-ups minus all their order costs. There is no separate per-day payment: employees maintain a positive balance by topping up periodically, and each order they place draws down that balance.

Admin monitors the fund overall: if the sum of all employee balances is negative, the fund is in deficit and admin must cover the shortfall out of pocket.

---

## Prisma Schema

```prisma
model LedgerEntry {
  id          String      @id @default(cuid())
  employeeId  String
  employee    Employee    @relation(fields: [employeeId], references: [id])
  amount      Int         // VND, signed: positive = top-up, negative = order cost
  type        String      // "topup" | "order_debit" | "adjustment"
  note        String?     // free-text; for adjustments: reason; for order_debits: date string
  orderId     String?     // set only when type = "order_debit"; references the order
  createdAt   DateTime    @default(now())
  createdBy   String?     // employeeId of who created this entry; null = system

  @@map("ledger_entries")
}
```

### Field notes

| Field | Notes |
|---|---|
| `amount` | Signed integer VND. Top-up: `+50000`. Order debit: `-45000`. Adjustment: any signed value. |
| `type` | `"topup"` — member deposited money; `"order_debit"` — order placed; `"adjustment"` — admin correction |
| `note` | For `order_debit`: the menu date string (e.g. `"04/04/2026"`) for display grouping. For `adjustment`: reason. |
| `orderId` | References the `Order` record when `type = "order_debit"`. Used to match/display. Not a FK — Order may be hard-deleted (cancelled), in which case the debit entry is also removed. |
| `createdBy` | The `employeeId` who initiated the entry. `null` = system-generated (e.g. auto order). For topups: the member themselves. For admin adjustments: the admin's employeeId. |

---

## Balance Computation

Balance is **never stored** — always computed as `SUM(ledgerEntries.amount)` for a given employee.

```ts
// Compute balance for one employee
const entries = await prisma.ledgerEntry.findMany({
  where: { employeeId },
})
const balance = entries.reduce((sum, e) => sum + e.amount, 0)
```

A negative balance means the employee owes money to the fund. Ordering is still allowed — there is no hard block on negative balance.

---

## Entry Types & When They Are Written

### `topup` — Member deposits money

Written when:
- Member submits a top-up via the Finance tab on `/` (self-service)
- Admin adds a top-up on behalf of a member via `/admin/finance`

```ts
await prisma.ledgerEntry.create({
  data: {
    employeeId,
    amount: topupAmount,        // positive integer VND
    type: "topup",
    note: null,
    createdBy: initiatorEmployeeId,  // member's own id, or admin's id
  },
})
```

### `order_debit` — Order placed

Written **when an order is created** (including auto orders on publish).

```ts
await prisma.ledgerEntry.create({
  data: {
    employeeId: order.employeeId,
    amount: -(item.price * order.quantity),  // negative
    type: "order_debit",
    orderId: order.id,
    note: formatDate(menuOfDay.date),         // e.g. "04/04/2026"
    createdBy: null,                          // system
  },
})
```

Written in the **same DB transaction** as the `Order.create`.

### `order_debit` — Order cancelled

When an order is cancelled (hard-deleted), its corresponding `LedgerEntry` of type `order_debit` is also deleted in the same transaction.

```ts
await prisma.$transaction([
  prisma.order.delete({ where: { id: orderId } }),
  prisma.ledgerEntry.deleteMany({ where: { orderId } }),
])
```

### `order_debit` — Order quantity edited

When order quantity changes, the existing `order_debit` entry is **replaced** (delete + create) in the same transaction as the order update.

```ts
await prisma.$transaction([
  prisma.order.update({ where: { id: orderId }, data: { quantity: newQuantity, menuOfDayItemId: newItemId } }),
  prisma.ledgerEntry.deleteMany({ where: { orderId } }),
  prisma.ledgerEntry.create({
    data: {
      employeeId: order.employeeId,
      amount: -(newItem.price * newQuantity),
      type: "order_debit",
      orderId,
      note: formatDate(menuOfDay.date),
      createdBy: null,
    },
  }),
])
```

### `adjustment` — Admin corrects balance

Admin can directly set an employee's balance to a specific value. This is implemented as a single `adjustment` entry whose amount = `targetBalance - currentBalance`.

```ts
const currentBalance = await computeBalance(employeeId)
const delta = targetBalance - currentBalance

await prisma.ledgerEntry.create({
  data: {
    employeeId,
    amount: delta,
    type: "adjustment",
    note: reason ?? "Admin adjustment",
    createdBy: adminEmployeeId,
  },
})
```

This preserves the full history — the adjustment entry is visible in the ledger alongside topups and order debits.

---

## Business Rules

### No hard block on negative balance

Employees can place orders even when their balance is zero or negative. The system shows the balance prominently so employees are aware they owe money, but never prevents ordering.

### Top-up is immediate and self-service

No approval workflow. Member submits a top-up amount → `LedgerEntry` is written immediately → balance updates. Admin can correct mistakes via an `adjustment` entry.

### Admin override = adjustment entry

Admin never directly edits existing `LedgerEntry` records. To correct a balance, admin inputs the desired target balance and the system computes and writes one `adjustment` entry. This keeps a full audit trail.

### Atomic order + debit

Creating, editing, or cancelling an order always updates the ledger in the same DB transaction. It is never valid to have an `Order` without a corresponding `LedgerEntry` of type `order_debit`, or vice versa.

This invariant also holds for indirect deletions:
- **Menu item removal:** when an admin removes a dish post-publish, all orders for that item and their `order_debit` ledger entries are deleted in the same transaction
- **Employee hard-delete:** when a super admin deletes an employee, all their ledger entries (topups, debits, adjustments) and orders are deleted in the same transaction

---

## Fund Overview (Admin)

The total fund balance = `SUM` of all employee balances = `SUM` of all `LedgerEntry.amount` across all employees.

- Positive total → fund has surplus (employees have pre-paid more than they've consumed)
- Negative total → fund is in deficit (admin needs to cover out of pocket)

```ts
const totalFund = await prisma.ledgerEntry.aggregate({
  _sum: { amount: true },
})
const fundBalance = totalFund._sum.amount ?? 0
```

---

## API Response Shapes

### GET /api/finance/balance?employeeId=

```ts
type BalanceResponse = {
  employeeId: string
  balance: number   // VND, signed integer; negative = owes money
}
```

### GET /api/finance/ledger?employeeId=

Returns full ledger history for one employee, newest first.

```ts
type LedgerEntryItem = {
  id: string
  amount: number       // signed VND
  type: "topup" | "order_debit" | "adjustment"
  note: string | null
  orderId: string | null
  createdAt: string    // ISO
  createdBy: string | null   // employeeId
}
```

### GET /api/finance/summary (admin)

Returns balance for all active employees + total fund balance.

```ts
type FinanceSummaryResponse = {
  fundBalance: number  // total of all employee balances
  employees: {
    id: string
    name: string
    balance: number
  }[]
}
```

### POST /api/finance/topup

```ts
type TopupInput = {
  employeeId: string
  amount: number      // positive integer VND
}
```

### GET /api/finance/fund-ledger?month=YYYY-MM

```ts
type FundLedgerDish = {
  name: string
  quantity: number
  subtotal: number
  employees: { name: string; quantity: number }[]  // sorted by name asc
}

type FundLedgerItem =
  | {
      type: "lunch_day"
      date: string
      totalAmount: number
      orderCount: number
      dishes: FundLedgerDish[]
    }
  | {
      type: "topup" | "adjustment"
      date: string
      amount: number
      employeeName: string
      note: string | null
    }

type FundLedgerResponse = {
  month: string
  items: FundLedgerItem[]
}
```

### POST /api/finance/adjust (admin only)

```ts
type AdjustInput = {
  employeeId: string
  targetBalance: number   // the desired resulting balance
  note?: string
}
```