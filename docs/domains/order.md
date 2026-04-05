# Domain: Order

> Schema, business rules, and helpers for Order and payment logic.
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
  isPaid          Boolean       @default(false)
  paidAt          DateTime?
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
| `isPaid` | Payment state — toggled by employee via "Confirm Payment", or undone by admin |
| `paidAt` | Set to `now()` when paid, `null` when unpaid or undone |

---

## Business Rules

### Placing an order

- Orders can only be created when `MenuOfDay.isPublished = true` AND `MenuOfDay.isLocked = false`
- One employee can place multiple orders on the same day (different `menuOfDayItemId`)
- `menuOfDayId` must match the `menuOfDayItem.menuOfDayId` — cannot mix items from different days

### Editing an order

- Only allowed while `MenuOfDay.isLocked = false`
- Can change `menuOfDayItemId` (must belong to the same `menuOfDay`) or `quantity`

### Cancelling an order

- Only allowed while `MenuOfDay.isLocked = false`
- Hard delete — the `Order` record is removed from the database

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

## Payment Flow

No payment processing. Bank transfer via QR code only.

### Employee pays

1. Employee opens "Payment" tab on `/`
2. Sees table of all orders where `isPaid = false` across entire history
3. Sees total outstanding amount + QR code image from `AppConfig.qrCodeUrl`
4. Transfers money via bank → clicks "Confirm Payment"
5. `PATCH /api/orders/pay` — sets `isPaid = true`, `paidAt = now()` for **all** unpaid orders of that employee

```ts
// PATCH /api/orders/pay body
type PayAllInput = {
  employeeId: string
}

// DB operation
await prisma.order.updateMany({
  where: { employeeId, isPaid: false },
  data: { isPaid: true, paidAt: new Date() },
})
```

### Admin undoes payment

Admin can undo payment for a specific employee on a specific date (e.g. to correct a mistake).

```ts
// PATCH /api/orders/unpay body
type UnpayInput = {
  employeeId: string
  date: string  // YYYY-MM-DD
}

// DB operation
await prisma.order.updateMany({
  where: {
    employeeId,
    menuOfDay: { date: parseDateParam(date) },
    isPaid: true,
  },
  data: { isPaid: false, paidAt: null },
})
```

---

## Slack — Payment Reminder (Cron)

Runs daily at 13:00 via Vercel Cron. Only fires if a published menu exists for today.

### Logic

```ts
// 1. Check if today has a published menu
const menu = await prisma.menuOfDay.findFirst({
  where: { date: getTodayUTC(), isPublished: true },
})
if (!menu) return  // no menu today — skip

// 2. Count employees with unpaid orders today
const unpaidEmployeeIds = await prisma.order.findMany({
  where: { menuOfDayId: menu.id, isPaid: false },
  select: { employeeId: true },
  distinct: ["employeeId"],
})
const count = unpaidEmployeeIds.length
if (count === 0) return  // everyone paid — skip

// 3. Post to channel
await postChannel(
  `💰 ${count} người chưa trả tiền cơm hôm nay. Trả tại: ${appUrl}`
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
// /api/cron/remind-payment/route.ts
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
  isPaid: boolean
  paidAt: string | null
  menuOfDayItem: {
    id: string
    price: number
    sideDishes: string | null
    menuItem: { id: string; name: string }
  }
}
```

### GET /api/orders/unpaid?employeeId=

```ts
type UnpaidOrderItem = {
  id: string
  quantity: number
  isPaid: false
  menuOfDay: { id: string; date: string }
  menuOfDayItem: {
    id: string
    price: number
    menuItem: { id: string; name: string }
  }
}
```

### GET /api/orders/today (admin view)

```ts
type TodayOrderItem = {
  id: string
  quantity: number
  isAutoOrder: boolean
  isPaid: boolean
  paidAt: string | null
  employee: { id: string; name: string }
  menuOfDayItem: {
    id: string
    price: number
    menuItem: { id: string; name: string }
  }
}
```