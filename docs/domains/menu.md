# Domain: Menu

> Schema, business rules, and helpers for MenuOfDay and MenuOfDayItem.
> Big picture → `docs/OVERVIEW.md`. Feature detail → `src/features/menu-management/SPEC.md`.

---

## Prisma Schema

```prisma
model MenuOfDay {
  id          String          @id @default(cuid())
  date        DateTime        @unique  // 00:00:00 UTC representing the day in Asia/Ho_Chi_Minh
  isPublished Boolean         @default(false)
  isLocked    Boolean         @default(false)
  createdAt   DateTime        @default(now())
  updatedAt   DateTime        @updatedAt
  items       MenuOfDayItem[]
  orders      Order[]

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
| `MenuOfDayItem.name` | Dish name stored directly as a string — no separate catalog entity |
| `MenuOfDayItem.price` | VND, specific to this day — same dish can have different prices on different days |
| `MenuOfDayItem.sideDishes` | Free-text, e.g. `"Nộm, canh bầu, chả cá"` — specific to this day |
| `MenuOfDayItem` cascade | Deleted automatically when parent `MenuOfDay` is deleted |
| `@@unique([menuOfDayId, name])` | One dish name per day — prevents duplicates |

---

## MenuOfDay Lifecycle

```
DRAFT ──→ PUBLISHED ──→ LOCKED
               ↑____________↓  (admin can unlock)
```

### Transition: Draft → Published

Atomic — all steps succeed or none are applied:

1. Set `MenuOfDay.isPublished = true`
2. Create auto orders for eligible employees → `docs/domains/order.md`
3. Post channel message to Slack: today's dishes + prices + order link
4. Send Slack DMs to auto-order employees who have a `slackId`

### Transition: Published → Locked

1. Set `MenuOfDay.isLocked = true`
2. All order mutations (create / update / delete) are rejected

### Transition: Locked → Published (Unlock)

1. Set `MenuOfDay.isLocked = false`
2. Order mutations are allowed again

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

All menu editing happens in the frontend Zustand store. DB writes happen only on explicit save/publish actions.

### Pre-publish

Admin fills in dishes in a spreadsheet-style table. On "Đăng thực đơn":
- `POST /api/menu/publish` with full item list — single request
- Server atomically creates `MenuOfDay` + all `MenuOfDayItem` records + auto orders + Slack

### Post-publish

Admin can continue editing the table inline. On "Lưu thay đổi":
- `PATCH /api/menu/[id]/items` with full current item list — single request
- Server diffs against existing DB records: upserts matching items, deletes removed items
- If a removed item has orders → return 409 with blocked dish names

### MenuOfDayItem deletion guard

Cannot delete a `MenuOfDayItem` that has existing `Order` records. The PATCH endpoint returns a 409 with the list of blocked dish names.

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

---

## API Response Shapes

### MenuOfDayResponse

```ts
type MenuOfDayResponse = {
  id: string
  date: string           // ISO string
  isPublished: boolean
  isLocked: boolean
  items: {
    id: string
    name: string
    price: number
    sideDishes: string | null
  }[]
}
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
