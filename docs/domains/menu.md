# Domain: Menu

> Schema, business rules, and helpers for MenuItem, MenuOfDay, and MenuOfDayItem.
> Big picture → `docs/OVERVIEW.md`. Feature detail → `src/features/menu-management/SPEC.md`.

---

## Prisma Schema

```prisma
model MenuItem {
  id             String          @id @default(cuid())
  name           String
  isActive       Boolean         @default(true)
  createdAt      DateTime        @default(now())
  menuOfDayItems MenuOfDayItem[]

  @@map("menu_items")
}

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
  menuItemId  String
  menuItem    MenuItem  @relation(fields: [menuItemId], references: [id])
  price       Int       // VND
  sideDishes  String?
  orders      Order[]

  @@map("menu_of_day_items")
}
```

### Field notes

| Field | Notes |
|---|---|
| `MenuOfDay.date` | Always `00:00:00 UTC` representing midnight Asia/Ho_Chi_Minh — enforced by `@unique` |
| `MenuOfDayItem.price` | VND, specific to this day — same dish can have different prices on different days |
| `MenuOfDayItem.sideDishes` | Free-text, e.g. `"Nộm, canh bầu, chả cá"` — specific to this day |
| `MenuOfDayItem` cascade | Deleted automatically when parent `MenuOfDay` is deleted |

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

## MenuOfDayItem — Creation Rules

Admin uses a single autocomplete input to add a dish to today's menu. The `MenuItem` layer is mostly transparent to admin.

### Flow A — Select existing dish

1. Admin types → autocomplete suggests matching `MenuItem` (case-insensitive, `isActive = true` only)
2. Admin selects → system queries most recent `MenuOfDayItem` with same `menuItemId`
3. Pre-fills `price` and `sideDishes` from that record
4. Admin reviews/overrides → saves

### Flow B — New dish name

1. Admin types a name not found in catalog → system auto-creates a new `MenuItem`
2. `price` and `sideDishes` are empty — admin fills in manually
3. Admin saves → `MenuOfDayItem` created, `MenuItem` added to catalog

### Auto-fill query

```ts
const previous = await prisma.menuOfDayItem.findFirst({
  where: { menuItemId },
  orderBy: { menuOfDay: { date: "desc" } },
})
// pre-fill price and sideDishes if found
```

### MenuOfDayItem deletion guard

Cannot delete a `MenuOfDayItem` that has existing `Order` records. Admin must cancel those orders first.

---

## Pre-fill from Previous Day

No menu is written to DB until admin publishes. Until then, the UI is pre-populated with the previous day's items.

### GET /api/menu/today response

```ts
// When today already has a published or draft MenuOfDay:
type MenuTodayResponse =
  | { status: "exists"; menu: MenuOfDayResponse }

// When no MenuOfDay exists for today yet:
  | { status: "prefill"; items: PrefillItem[] }

type PrefillItem = {
  menuItemId: string
  menuItemName: string
  price: number
  sideDishes: string | null
}
```

- `prefill` items come from the most recent `MenuOfDay` that has at least one `MenuOfDayItem`
- If no previous menu exists at all → `{ status: "prefill", items: [] }` (admin starts from scratch)
- Client renders prefill items exactly like a real menu — admin adds/removes/edits freely in UI state only

### Publish with items

When admin clicks "Đăng thực đơn", a single `POST /api/menu/publish` call:
1. Creates `MenuOfDay` for today
2. Creates all `MenuOfDayItem` records from the current UI state
3. Auto-creates any new `MenuItem` records for dish names not yet in catalog
4. Sets `isPublished = true`
5. Triggers Slack + auto orders (same as before)

```ts
// POST /api/menu/publish body
type PublishMenuInput = {
  items: {
    menuItemName: string   // used to lookup or create MenuItem
    price: number
    sideDishes?: string
  }[]
}
```

### Editing after publish

Once published, `PATCH /api/menu/[id]` handles add/edit/remove of individual `MenuOfDayItem` records as before.

---

## MenuItem Soft Delete

Setting `MenuItem.isActive = false`:
- Hides it from autocomplete
- Does **not** affect existing `MenuOfDayItem` or `Order` records
- Dish name still appears correctly in historical reports

---

## API Response Shapes

### GET /api/menu/today

```ts
type MenuOfDayResponse = {
  id: string
  date: string           // ISO string
  isPublished: boolean
  isLocked: boolean
  items: {
    id: string
    price: number
    sideDishes: string | null
    menuItem: {
      id: string
      name: string
    }
  }[]
}
```

### GET /api/menu-items

```ts
type MenuItemListItem = {
  id: string
  name: string
  isActive: boolean
  createdAt: string
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