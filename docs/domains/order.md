# Domain: Order

> Schema, business rules, and helpers for Order logic.
> Payment / balance logic → `docs/domains/ledger.md`.
> Big picture → `docs/OVERVIEW.md`. Auto order trigger → tied to menu publish in `docs/domains/menu.md`.
> Feature detail → `src/features/home/SPEC.md`, `src/features/admin-dashboard/SPEC.md`.

---

## Prisma Schema

```prisma
model Order {
  id              String        @id @default(cuid())
  menuOfDayId     String
  menuOfDay       MenuOfDay     @relation(fields: [menuOfDayId], references: [id])
  employeeId      String
  employee        Employee      @relation(fields: [employeeId], references: [id])
  menuOfDayItemId String
  menuOfDayItem   MenuOfDayItem @relation(fields: [menuOfDayItemId], references: [id])
  quantity        Int           @default(1)
  isAutoOrder     Boolean       @default(false)
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  // No unique(menuOfDayId, employeeId) — one employee can have multiple orders per day

  @@map("orders")
}
```

### Field notes

| Field | Notes |
|---|---|
| `quantity` | `>= 1`, no upper limit |
| `isAutoOrder` | `true` = created automatically on menu publish; behaves like any normal order after creation |

Note: There is **no `isPaid` / `paidAt`** on `Order`. Payment state is replaced by the ledger system — see `docs/domains/ledger.md`.

---

## Business Rules

### Placing an order

- Orders can only be created when `MenuOfDay.isPublished = true` AND `MenuOfDay.isLocked = false`
- One employee can place multiple orders on the same day (different `menuOfDayItemId`)
- `menuOfDayId` must match the `menuOfDayItem.menuOfDayId` — cannot mix items from different days
- Creating an order also writes a `LedgerEntry` of type `order_debit` in the same DB transaction — see Ledger domain for details

### Editing an order

- Only allowed while `MenuOfDay.isLocked = false`
- Can change `menuOfDayItemId` (must belong to the same `menuOfDay`) or `quantity`

### Cancelling an order

- Only allowed while `MenuOfDay.isLocked = false`
- Hard delete — the `Order` record is removed from the database
- The corresponding `LedgerEntry` of type `order_debit` is also deleted in the same transaction — see Ledger domain for details

### Guard (applied in all order mutation API routes)

```ts
const menuOfDay = await prisma.menuOfDay.findUnique({ where: { id: menuOfDayId } })

if (!menuOfDay) {
  return NextResponse.json({ error: "Menu not found" }, { status: 404 })
}
if (!menuOfDay.isPublished || menuOfDay.isLocked) {
  return NextResponse.json({ error: "Orders are not open" }, { status: 403 })
}
```

---

## Auto Order

Triggered atomically as part of the menu publish transition. Runs inside the same DB transaction as setting `isPublished = true`.

### Eligibility check (per employee)

```ts
const eligible =
  employee.isActive === true &&
  employee.autoOrder === true &&
  (await prisma.order.count({
    where: { menuOfDayId, employeeId: employee.id },
  })) === 0
```

### Creation logic

```ts
// For each eligible employee:
const randomItem = items[Math.floor(Math.random() * items.length)]

await prisma.order.create({
  data: {
    menuOfDayId,
    employeeId: employee.id,
    menuOfDayItemId: randomItem.id,
    quantity: 1,
    isAutoOrder: true,
  },
})

// Send Slack DM if slackId is set
if (employee.slackId) {
  await postDM(employee.slackId, buildAutoOrderMessage(randomItem, appUrl))
}
```

### Slack DM message

```
🍱 Hôm nay hệ thống tự đặt cho bạn: {dish name} x1 — {price}đ.
Muốn đổi hoặc hủy, vào đây trước khi admin chốt sổ: {NEXT_PUBLIC_APP_URL}
```

### Override

Once created, an auto order behaves like any normal order — employee can edit or cancel it freely while `isLocked = false`.

---

## Slack — Balance Reminder (Cron)

Runs daily at 13:00 via Vercel Cron. Only fires if a published menu exists for today.
Reminder targets employees whose **computed balance** (top-ups minus order costs) is negative.

### Logic

```ts
// 1. Check if today has a published menu
const menu = await prisma.menuOfDay.findFirst({
  where: { date: getTodayUTC(), isPublished: true },
})
if (!menu) return  // no menu today — skip

// 2. Find employees with negative balance
// Balance = SUM of LedgerEntry.amount for each employee
// (top-ups are positive, order costs are negative)
const employees = await prisma.employee.findMany({
  where: { isActive: true },
  include: { ledgerEntries: true },
})

const inDebt = employees.filter(e => {
  const balance = e.ledgerEntries.reduce((sum, entry) => sum + entry.amount, 0)
  return balance < 0
})

if (inDebt.length === 0) return  // everyone has positive balance — skip

// 3. Post to channel
await postChannel(
  `💰 ${inDebt.length} người đang có số dư âm. Vào đây để nạp tiền: ${appUrl}`
)
```

### Vercel cron config (`vercel.json`)

```json
{
  "crons": [
    {
      "path": "/api/cron/remind-payment",
      "schedule": "0 6 * * 1-5"
    }
  ]
}
```

> `0 6 * * 1-5` = 06:00 UTC = 13:00 Asia/Ho_Chi_Minh, Monday–Friday.

### Cron route security

```ts
const auth = request.headers.get("Authorization")
if (auth !== `Bearer ${env.CRON_SECRET}`) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
}
```

---

## API Response Shapes

### GET /api/orders?employeeId=&date=

```ts
type OrderItem = {
  id: string
  quantity: number
  isAutoOrder: boolean
  menuOfDayItem: {
    id: string
    name: string
    price: number
    sideDishes: string | null
  }
}
```

### GET /api/orders/today (admin view)

```ts
type TodayOrderItem = {
  id: string
  quantity: number
  isAutoOrder: boolean
  employee: { id: string; name: string }
  menuOfDayItem: {
    id: string
    name: string
    price: number
  }
}
```