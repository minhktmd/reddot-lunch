# Domain: Menu

> Schema, business rules, and helpers for MenuOfDay, MenuOfDayItem, and ExternalDishItem.
> Big picture → `docs/OVERVIEW.md`. Feature detail → `src/features/menu-management/SPEC.md`.

---

## Prisma Schema

```prisma
model MenuOfDay {
  id              String          @id @default(cuid())
  date            DateTime        @unique  // 00:00:00 UTC representing the day in Asia/Ho_Chi_Minh
  isPublished     Boolean         @default(false)
  isLocked        Boolean         @default(false)
  externalDishes  Json            @default("[]")  // ExternalDishItem[]
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt
  items           MenuOfDayItem[]
  orders          Order[]

  @@map("menu_of_days")
}

model MenuOfDayItem {
  id          String    @id @default(cuid())
  menuOfDayId String
  menuOfDay   MenuOfDay @relation(fields: [menuOfDayId], references: [id], onDelete: Cascade)
  name        String    // dish name stored directly — no FK to a catalog entity
  price       Int       // VND integer (e.g. 45000)
  sideDishes  String?
  orders      Order[]

  @@unique([menuOfDayId, name])
  @@map("menu_of_day_items")
}
```

### Field notes

| Field | Notes |
|---|---|
| `MenuOfDay.date` | Always `00:00:00 UTC` representing midnight Asia/Ho_Chi_Minh — enforced by `@unique` |
| `MenuOfDay.externalDishes` | JSON array of `ExternalDishItem` — display-only delivery links; no orders, no payment |
| `MenuOfDayItem.name` | Dish name stored directly as a string — no separate catalog entity |
| `MenuOfDayItem.price` | VND, specific to this day — same dish can have different prices on different days |
| `MenuOfDayItem.sideDishes` | Free-text, e.g. `"Nộm, canh bầu, chả cá"` — specific to this day |
| `MenuOfDayItem` cascade | Deleted automatically when parent `MenuOfDay` is deleted |
| `@@unique([menuOfDayId, name])` | One dish name per day — prevents duplicates |

---

## ExternalDishItem

External dishes are delivery platform links (Grab, ShopeeFood, Be, Foody, etc.) that admin can attach to today's menu for employees who want to order outside the standard menu. They are stored as a JSON array directly on `MenuOfDay` — no separate table.

```ts
// src/domains/menu/types/menu.type.ts
export type ExternalDishItem = {
  name: string      // e.g. "Bún sườn chua — Trần Huy Liệu"
  orderUrl: string  // valid URL — deep link to restaurant/dish on delivery platform
}
```

### Business rules

- **Display-only** — no orders, no payment tracking, no quantity counting
- **Per-day** — stored on `MenuOfDay.externalDishes`; no history or reuse across days
- **Editable from Screen 1** — admin can add external dishes before publishing; held in Zustand draft store alongside menu items and sent to the server in the publish request
- **Always full replacement post-publish** — `PATCH /api/menu/[id]/external-dishes` receives the complete array and overwrites; no partial add/remove endpoints
- **Only editable when unlocked** — post-publish mutations guarded by `isLocked`; if `isLocked = true` the PATCH returns `403`
- **Not pre-filled from previous day** — external dish links change daily; admin adds them fresh each time
- **On the home page** — shown below the standard menu cards in both unlocked and locked states; links always remain clickable regardless of lock state

### Publish validation

A menu can be published if it has **at least one standard dish OR at least one external dish**. It is valid to publish a menu with only external dishes and no `MenuOfDayItem` records — for days when the whole office orders externally.

```ts
const hasItems = draftItems.some(i => i.name.trim() !== '' && i.price > 0)
const hasExternalDishes = draftExternalDishes.length > 0

if (!hasItems && !hasExternalDishes) {
  // show inline error: "Thêm ít nhất một món ăn hoặc một món ăn ngoài trước khi đăng"
}
```

### Zod validation schema

```ts
const externalDishItemSchema = z.object({
  name: z.string().min(1),
  orderUrl: z.string().url(),
})

const saveExternalDishesSchema = z.object({
  externalDishes: z.array(externalDishItemSchema),
})
```

---

## MenuOfDay Lifecycle

```
DRAFT ──→ PUBLISHED ──→ LOCKED
               ↑____________↓  (admin can unlock)
```

### Transition: Draft → Published

Atomic — all steps succeed or none are applied:

1. Set `MenuOfDay.isPublished = true`
2. Create `MenuOfDayItem` records from draft items (may be empty array on external-dishes-only days)
3. Store `externalDishes` JSON from draft
4. Create auto orders for eligible employees (only runs if standard items exist) → `docs/domains/order.md`
5. Post channel message to Slack: today's dishes + prices + order link
6. Send Slack DMs to auto-order employees who have a `slackId`

### Transition: Published → Locked

1. Set `MenuOfDay.isLocked = true`
2. All order mutations (create / update / delete) are rejected
3. External dish mutations (`PATCH /api/menu/[id]/external-dishes`) are also rejected

### Transition: Locked → Published (Unlock)

1. Set `MenuOfDay.isLocked = false`
2. Order mutations are allowed again
3. External dish mutations are allowed again

### Ordering guard

All order mutation API routes must check:

```ts
if (!menuOfDay.isPublished || menuOfDay.isLocked) {
  return NextResponse.json({ error: "Orders are not open" }, { status: 403 })
}
```

---

## Autocomplete — History-Based Suggestions

There is **no separate dish catalog entity**. Autocomplete is sourced from historical `MenuOfDayItem` records.

### GET /api/menu/suggestions

Returns deduplicated dish names + prices from all past `MenuOfDayItem` records, sorted alphabetically.

```ts
type MenuSuggestion = {
  name: string
  price: number  // from most recent occurrence
}
```

### Frontend flow

1. On page load, fetch suggestions into the Zustand store
2. When admin types in the dish name cell, filter suggestions client-side (no extra API call)
3. Selecting a suggestion auto-fills `name` and `price` — `sideDishes` stays empty
4. Typing a name not in suggestions = new dish, no problem

**`sideDishes` is intentionally NOT suggested** — side dishes change daily.

---

## Menu Editing — Batch Store Pattern

All edits (menu items and external dishes) happen in the frontend Zustand store before publish. DB writes happen only on explicit save/publish actions.

### Pre-publish (Screen 1)

Admin fills in standard dishes in the spreadsheet table and/or adds external dish links in the section below. All edits are store-only. On "Đăng thực đơn":
- `POST /api/menu/publish` with `{ items, externalDishes }` — single request
- Server atomically creates `MenuOfDay` + all `MenuOfDayItem` records + stores `externalDishes` + auto orders + Slack
- Validation: at least one valid standard item OR at least one external dish required

### Post-publish (Screen 2)

**Standard items:** admin edits inline → "Lưu thay đổi" → `PATCH /api/menu/[id]/items` — single request. Server diffs: upserts matching items, cascade-deletes removed items. If a removed item has orders, the orders and their `LedgerEntry` records are deleted in the same transaction.

**External dishes:** each add or remove writes directly to the DB — not store-buffered. Component derives the full new array and calls `PATCH /api/menu/[id]/external-dishes`. On success: invalidate `queryKeys.menu.today()`.

### MenuOfDayItem deletion cascade

Deleting a `MenuOfDayItem` cascade-deletes all associated `Order` records and their `LedgerEntry` records (type `order_debit`) in the same transaction. This ensures employee balances stay correct when an admin removes a dish post-publish.

---

## Pre-fill from Previous Day

No menu is written to DB until admin publishes. The GET /api/menu/today endpoint returns prefill items from the most recent menu.

### GET /api/menu/today response

```ts
type MenuTodayResponse =
  | { status: "exists"; menu: MenuOfDayResponse }
  | { status: "prefill"; items: PrefillItem[] }

type PrefillItem = {
  name: string
  price: number
  sideDishes: string | null
}
```

`externalDishes` are intentionally **not pre-filled** — they change daily and must be added fresh.

---

## API Response Shapes

### MenuOfDayResponse

```ts
type MenuOfDayResponse = {
  id: string
  date: string           // ISO string
  isPublished: boolean
  isLocked: boolean
  externalDishes: ExternalDishItem[]
  items: {
    id: string
    name: string
    price: number
    sideDishes: string | null
    orderCount: number   // number of Order rows referencing this item (not sum of quantity)
  }[]
}
```

`orderCount` is computed server-side via Prisma's `_count`:

```ts
const menu = await prisma.menuOfDay.findUnique({
  where: { date: getTodayUTC() },
  include: {
    items: {
      include: { _count: { select: { orders: true } } }
    }
  }
})

// Map to response shape:
items: menu.items.map(item => ({
  id: item.id,
  name: item.name,
  price: item.price,
  sideDishes: item.sideDishes,
  orderCount: item._count.orders,
}))
```

Always cast `menu.externalDishes` from Prisma's `Json` type before including in the response:

```ts
externalDishes: (menu.externalDishes as ExternalDishItem[]) ?? []
```

---

## Timezone Helpers

Live in `src/domains/menu/lib/date.ts`. Used by all menu-related API routes.

```ts
import { toZonedTime, fromZonedTime } from "date-fns-tz"

const TZ = "Asia/Ho_Chi_Minh"

// Today's date normalized to 00:00:00 UTC for DB storage/query
export function getTodayUTC(): Date {
  const now = new Date()
  const zoned = toZonedTime(now, TZ)
  const midnight = new Date(zoned.getFullYear(), zoned.getMonth(), zoned.getDate())
  return fromZonedTime(midnight, TZ)
}

// Parse YYYY-MM-DD route param into UTC date for DB query
export function parseDateParam(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number)
  const midnight = new Date(year, month - 1, day)
  return fromZonedTime(midnight, TZ)
}
```